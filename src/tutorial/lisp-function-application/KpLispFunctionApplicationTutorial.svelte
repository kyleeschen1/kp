<script lang="ts">
  import type {
    KpLispFunctionApplicationLesson,
    KpLispLessonMotionBlockRef
  } from "./lisp-function-application-lesson-compiler.ts";
  import {
    kpLispLessonMotionBlocks,
    type KpLispLessonMotionBlock,
    type KpLispLessonMotionBlockId
  } from "./lisp-function-application-motion-blocks.ts";
  import KpTutorialLessonShell from "../KpTutorialLessonShell.svelte";

  interface Props {
    lesson: KpLispFunctionApplicationLesson;
    tocHtml: string;
    motionScrubBarHtml: Readonly<Record<KpLispLessonMotionBlockId, string>>;
    stageHtml: string;
    animationId: string;
  }

  let {
    lesson,
    tocHtml,
    motionScrubBarHtml,
    stageHtml,
    animationId
  }: Props = $props();

  function motion(block: KpLispLessonMotionBlockRef): KpLispLessonMotionBlock {
    return kpLispLessonMotionBlocks.find(({ id }) => id === block.id)!;
  }
</script>

<KpTutorialLessonShell
  rootClass="kp-lisp-tutorial"
  layoutClass="kp-lisp-tutorial__layout"
  tocClass="kp-lisp-tutorial__toc"
  proseClass="kp-lisp-tutorial__prose"
  proseLabel="Lisp lesson"
  stageClass="kp-lisp-tutorial__stage"
  stageLabel="Persistent Lisp function application stage"
  stageAttributes={{
    "data-kp-animation-catalogue-stage": true,
    "data-kp-animation-catalogue-stage-persistent": "true"
  }}
  attributes={{
    "data-kp-lisp-function-application-tutorial": true,
    "data-kp-animation-catalogue": true,
    "data-kp-animation-catalogue-selection": animationId
  }}
>
  {#snippet before()}
    <h1 class="kp-tutorial-shell__visually-hidden kp-lisp-tutorial__visually-hidden">
      Lisp function application tutorial
    </h1>
  {/snippet}

  {#snippet toc()}
      {@html tocHtml}
  {/snippet}

  {#snippet prose()}
      <header class="kp-tutorial-shell__intro kp-lisp-tutorial__intro">
        <p class="kp-tutorial-shell__eyebrow kp-lisp-tutorial__eyebrow">{lesson.kicker}</p>
        <p class="kp-tutorial-shell__question kp-lisp-tutorial__question">{lesson.title}</p>
        <p class="kp-tutorial-shell__assumption kp-lisp-tutorial__assumption">{lesson.assumption}</p>
      </header>

      {#each lesson.sections as section}
        <section
          id={`kp-section-${section.id}`}
          data-kp-tutorial-destination="section"
          data-kp-tutorial-destination-id={section.id}
          aria-labelledby={`kp-heading-${section.id}`}
        >
          <h3 id={`kp-heading-${section.id}`}>{section.heading}</h3>

          {#each section.blocks as block}
            {#if block.kind === "passage"}
              <div
                class="kp-lisp-tutorial__passage"
                data-kp-lisp-tutorial-passage={block.id}
              >
                {#each block.paragraphs as paragraph}
                  <p>{@html paragraph.html}</p>
                {/each}
              </div>
            {:else}
              {@const definition = motion(block)}
              <div
                class="kp-tutorial-shell__motion-block kp-lisp-tutorial__motion-block"
                id={`kp-block-${definition.id}`}
                data-kp-tutorial-motion-block={definition.id}
                data-kp-tutorial-destination="block"
                data-kp-tutorial-destination-id={definition.id}
                role="group"
                aria-label={`${definition.label} animation step`}
              >
                {#each definition.checkpoints as checkpoint}
                  <span
                    class="kp-lisp-tutorial__checkpoint-anchor"
                    id={`kp-checkpoint-${checkpoint.id}`}
                    data-kp-tutorial-destination="checkpoint"
                    data-kp-tutorial-destination-id={checkpoint.id}
                    data-kp-tutorial-destination-block={definition.id}
                    aria-hidden="true"
                  ></span>
                {/each}
                {@html motionScrubBarHtml[definition.id]}
              </div>
            {/if}
          {/each}
        </section>
      {/each}

      <footer class="kp-lisp-tutorial__footer">
        <a href={`/?artifact=${animationId}`}>Open the animation catalogue</a>
      </footer>
  {/snippet}

  {#snippet stage()}
    <div data-kp-lisp-stage-host>{@html stageHtml}</div>
  {/snippet}
</KpTutorialLessonShell>
