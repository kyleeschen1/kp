#!/usr/bin/env python3
"""Compile Python source into plain syntax evidence without executing it."""

from __future__ import annotations

import argparse
import ast
import io
import json
import token
import tokenize
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class SourcePositions:
    source: str
    lines: tuple[str, ...]
    character_line_starts: tuple[int, ...]
    utf16_line_starts: tuple[int, ...]

    @classmethod
    def create(cls, source: str) -> "SourcePositions":
        lines = tuple(source.splitlines(keepends=True)) or ("",)
        character_starts: list[int] = []
        utf16_starts: list[int] = []
        character_offset = 0
        utf16_offset = 0
        for line in lines:
            character_starts.append(character_offset)
            utf16_starts.append(utf16_offset)
            character_offset += len(line)
            utf16_offset += utf16_length(line)
        return cls(
            source=source,
            lines=lines,
            character_line_starts=tuple(character_starts),
            utf16_line_starts=tuple(utf16_starts),
        )

    def ast_position(self, line_number: int, byte_column: int) -> tuple[int, int]:
        line = self.lines[line_number - 1]
        prefix = line.encode("utf-8")[:byte_column].decode("utf-8")
        return (
            self.character_line_starts[line_number - 1] + len(prefix),
            self.utf16_line_starts[line_number - 1] + utf16_length(prefix),
        )

    def ast_column(self, line_number: int, byte_column: int) -> int:
        line = self.lines[line_number - 1]
        return len(line.encode("utf-8")[:byte_column].decode("utf-8"))

    def token_position(self, line_number: int, column: int) -> tuple[int, int]:
        if line_number > len(self.lines):
            return len(self.source), utf16_length(self.source)
        prefix = self.lines[line_number - 1][:column]
        return (
            self.character_line_starts[line_number - 1] + len(prefix),
            self.utf16_line_starts[line_number - 1] + utf16_length(prefix),
        )


def utf16_length(value: str) -> int:
    return len(value.encode("utf-16-le")) // 2


def compile_frontend(path: str, revision_id: str, source: str) -> dict[str, Any]:
    positions = SourcePositions.create(source)
    diagnostics: list[dict[str, Any]] = []
    syntax: list[dict[str, Any]] = []
    tokens: list[dict[str, Any]] = []

    try:
        tree = ast.parse(source, filename=path, mode="exec", type_comments=True)
        collect_syntax(tree, None, positions, syntax)
    except SyntaxError as error:
        diagnostics.append(serialize_syntax_error(error, positions))

    try:
        tokens = collect_tokens(source, positions)
    except (tokenize.TokenError, IndentationError) as error:
        diagnostics.append({
            "code": type(error).__name__,
            "category": "error",
            "message": str(error),
        })

    return {
        "schemaVersion": "kp.python-frontend.v1",
        "status": "rejected" if diagnostics else "accepted",
        "language": "python",
        "path": path,
        "revisionId": revision_id,
        "sourceText": source,
        "syntax": syntax,
        "tokens": tokens,
        "diagnostics": diagnostics,
    }


def collect_syntax(
    node: ast.AST,
    parent_id: str | None,
    positions: SourcePositions,
    output: list[dict[str, Any]],
) -> None:
    kind_name = type(node).__name__
    if isinstance(node, ast.Module):
        start_character = 0
        end_character = len(positions.source)
        start_offset = 0
        end_offset = utf16_length(positions.source)
        start = {"line": 1, "column": 1}
        final_line = len(positions.lines)
        final_column = len(positions.lines[-1].rstrip("\r\n")) + 1
        end = {"line": final_line, "column": final_column}
    else:
        # Context and operator marker nodes carry structure but no source span.
        # Keep their positioned descendants attached to the nearest real owner.
        if not all(isinstance(getattr(node, name, None), int) for name in (
            "lineno", "col_offset", "end_lineno", "end_col_offset"
        )):
            for child in ast.iter_child_nodes(node):
                collect_syntax(child, parent_id, positions, output)
            return
        start_line = require_position(node, "lineno")
        start_column = require_position(node, "col_offset")
        end_line = require_position(node, "end_lineno")
        end_column = require_position(node, "end_col_offset")
        start_character, start_offset = positions.ast_position(start_line, start_column)
        end_character, end_offset = positions.ast_position(end_line, end_column)
        start = {
            "line": start_line,
            "column": positions.ast_column(start_line, start_column) + 1,
        }
        end = {
            "line": end_line,
            "column": positions.ast_column(end_line, end_column) + 1,
        }

    record_id = f"syntax.{kind_name}.{start_offset}.{end_offset}"
    facts = syntax_facts(node, positions)
    output.append({
        "id": record_id,
        "kindName": kind_name,
        **({} if parent_id is None else {"parentId": parent_id}),
        "startOffset": start_offset,
        "endOffset": end_offset,
        "start": start,
        "end": end,
        "text": positions.source[start_character:end_character],
        **({} if facts is None else {"facts": facts}),
    })
    for child in ast.iter_child_nodes(node):
        collect_syntax(child, record_id, positions, output)


def syntax_facts(
    node: ast.AST,
    positions: SourcePositions,
) -> dict[str, Any] | None:
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        parameters = [
            *node.args.posonlyargs,
            *node.args.args,
            *node.args.kwonlyargs,
        ]
        return {
            "declaredName": node.name,
            "parameterNames": [parameter.arg for parameter in parameters],
            "parameterAnnotations": [
                {
                    "name": parameter.arg,
                    **(
                        {}
                        if parameter.annotation is None
                        else {
                            "annotation": source_text_for_node(
                                parameter.annotation,
                                positions,
                            )
                        }
                    ),
                }
                for parameter in parameters
            ],
            **(
                {}
                if node.returns is None
                else {"returnAnnotation": source_text_for_node(node.returns, positions)}
            ),
            "hasVariadicParameters": (
                node.args.vararg is not None or node.args.kwarg is not None
            ),
        }
    if isinstance(node, ast.Call):
        return {
            **(
                {"calledName": node.func.id}
                if isinstance(node.func, ast.Name)
                else {}
            ),
            "argumentTexts": [
                source_text_for_node(argument, positions)
                for argument in node.args
            ],
            "hasKeywordArguments": bool(node.keywords),
        }
    if isinstance(node, (ast.Compare, ast.BoolOp)):
        referenced_names: list[str] = []
        names = sorted(
            (
                child
                for child in ast.walk(node)
                if isinstance(child, ast.Name) and isinstance(child.ctx, ast.Load)
            ),
            key=lambda child: (child.lineno, child.col_offset),
        )
        for child in names:
            if (
                child.id not in referenced_names
            ):
                referenced_names.append(child.id)
        return {"referencedNames": referenced_names}
    return None


def source_text_for_node(node: ast.AST, positions: SourcePositions) -> str:
    start_line = require_position(node, "lineno")
    start_column = require_position(node, "col_offset")
    end_line = require_position(node, "end_lineno")
    end_column = require_position(node, "end_col_offset")
    start_character, _ = positions.ast_position(start_line, start_column)
    end_character, _ = positions.ast_position(end_line, end_column)
    return positions.source[start_character:end_character]


def collect_tokens(source: str, positions: SourcePositions) -> list[dict[str, Any]]:
    output: list[dict[str, Any]] = []
    stream = tokenize.generate_tokens(io.StringIO(source).readline)
    for record in stream:
        start_character, start_offset = positions.token_position(*record.start)
        end_character, end_offset = positions.token_position(*record.end)
        text = positions.source[start_character:end_character]
        if text == "":
            continue
        output.append({
            "id": f"token.{record.type}.{start_offset}.{end_offset}",
            "tokenType": record.type,
            "kindName": token.tok_name.get(record.type, f"TOKEN_{record.type}"),
            "startOffset": start_offset,
            "endOffset": end_offset,
            "start": {"line": record.start[0], "column": record.start[1] + 1},
            "end": {"line": record.end[0], "column": record.end[1] + 1},
            "text": text,
        })
    return output


def serialize_syntax_error(
    error: SyntaxError,
    positions: SourcePositions,
) -> dict[str, Any]:
    line_number = error.lineno or 1
    column = max((error.offset or 1) - 1, 0)
    _, start_offset = positions.token_position(line_number, column)
    end_line = error.end_lineno or line_number
    end_column = max((error.end_offset or error.offset or 1) - 1, column)
    _, end_offset = positions.token_position(end_line, end_column)
    return {
        "code": "SyntaxError",
        "category": "error",
        "message": error.msg,
        "startOffset": start_offset,
        "endOffset": end_offset,
        "start": {"line": line_number, "column": column + 1},
        "end": {"line": end_line, "column": end_column + 1},
    }


def require_position(node: ast.AST, name: str) -> int:
    value = getattr(node, name, None)
    if not isinstance(value, int):
        raise ValueError(f"{type(node).__name__} is missing {name}")
    return value


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--path", required=True)
    parser.add_argument("--revision-id", required=True)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--source-file")
    source.add_argument("--source-text")
    return parser.parse_args()


def main() -> None:
    arguments = parse_arguments()
    if arguments.source_file is not None:
        with open(arguments.source_file, "r", encoding="utf-8") as handle:
            source = handle.read().removesuffix("\n")
    else:
        source = arguments.source_text
    if not arguments.path.strip() or not arguments.revision_id.strip() or not source.strip():
        raise ValueError("path, revision id, and source text must not be empty")
    json.dump(
        compile_frontend(arguments.path, arguments.revision_id, source),
        fp=__import__("sys").stdout,
        ensure_ascii=False,
        separators=(",", ":"),
    )
    print()


if __name__ == "__main__":
    main()
