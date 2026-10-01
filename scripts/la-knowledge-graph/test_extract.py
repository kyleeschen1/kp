import unittest
from extract import extract_xml, extract_tex

SOURCE = dict(book='ila', path='src/example.xml', sourceUrl='https://example.org/source')


class ExtractionTests(unittest.TestCase):
    def test_proof_ownership_and_citation_are_distinct(self):
        nodes, edges, aliases = extract_xml(SOURCE, '''<section xml:id="section"><title>Section</title>
          <theorem xml:id="claim"><statement><p>Assume finite dimension. Then <m>x=0</m>.</p></statement>
          <proof><p>Apply <xref ref="lemma"/>.</p></proof></theorem></section>''')
        theorem = next(n for n in nodes if n['kind'] == 'theorem')
        proof = next(n for n in nodes if n['kind'] == 'proof')
        self.assertIn('Assume finite dimension', theorem['body'])
        self.assertNotIn('Apply', theorem['body'])
        self.assertIn('[lemma]', proof['body'])
        self.assertTrue(any(e.get('target') == theorem['id'] and e['relation'] == 'proof-of' for e in edges))
        self.assertTrue(any(e['source'] == proof['id'] and e.get('anchor') == 'lemma' for e in edges))
        self.assertEqual(aliases['claim'], theorem['id'])

    def test_same_anchor_in_different_files_has_distinct_identity(self):
        a, _, _ = extract_xml(SOURCE, '<definition xml:id="duplicate">A</definition>')
        b, _, _ = extract_xml(dict(SOURCE, path='src/other.xml'), '<definition xml:id="duplicate">B</definition>')
        self.assertNotEqual(a[0]['id'], b[0]['id'])

    def test_surrounding_hypotheses_remain_in_context_record(self):
        nodes, _, _ = extract_xml(SOURCE, '''<section xml:id="context"><title>Context</title>
          <introduction><p>Throughout this section V is finite-dimensional.</p></introduction>
          <theorem xml:id="claim"><p>The conclusion.</p></theorem>
          <exercises><exercise><p>Unimported exercise.</p></exercise></exercises></section>''')
        context = next(n for n in nodes if n['kind'] == 'section')
        self.assertIn('finite-dimensional', context['body'])
        self.assertNotIn('The conclusion', context['body'])
        self.assertNotIn('Unimported exercise', context['body'])

    def test_nested_tex_and_adjacent_proof(self):
        text = r'''\begin{theorem}\label{th:one}For all x,
        \begin{align}x&=x\end{align}\end{theorem}
        % source comment
        \begin{proof}Use \ref{df:identity}.\end{proof}'''
        nodes, edges, _ = extract_tex(dict(SOURCE, book='hefferon'), text)
        self.assertEqual(len(nodes), 2)
        self.assertIn(r'\begin{align}', nodes[0]['body'])
        self.assertTrue(any(e['relation'] == 'proof-of' for e in edges))

    def test_prose_between_theorem_and_proof_does_not_infer_ownership(self):
        text = r'\begin{theorem}A\end{theorem}Unrelated argument.\begin{proof}B\end{proof}'
        _, edges, _ = extract_tex(dict(SOURCE, book='hefferon'), text)
        self.assertFalse(any(e['relation'] == 'proof-of' for e in edges))


if __name__ == '__main__':
    unittest.main()
