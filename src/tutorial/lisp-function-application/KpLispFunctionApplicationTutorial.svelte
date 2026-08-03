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

<main
  class="kp-lisp-tutorial"
  data-kp-lisp-function-application-tutorial
  data-kp-animation-catalogue
  data-kp-animation-catalogue-selection={animationId}
>
  <h1 class="kp-lisp-tutorial__visually-hidden">Lisp function application tutorial</h1>

  <div class="kp-lisp-tutorial__layout">
    <aside class="kp-lisp-tutorial__toc" aria-label="Lesson navigation">
      {@html tocHtml}
    </aside>

    <article class="kp-lisp-tutorial__prose" aria-label="Lisp lesson">
      <header class="kp-lisp-tutorial__intro">
        <p class="kp-lisp-tutorial__eyebrow">{lesson.kicker}</p>
        <p class="kp-lisp-tutorial__question">{lesson.title}</p>
        <p class="kp-lisp-tutorial__assumption">{lesson.assumption}</p>
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
                class="kp-lisp-tutorial__motion-block"
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
    </article>

    <aside
      class="kp-lisp-tutorial__stage"
      data-kp-animation-catalogue-stage
      data-kp-animation-catalogue-stage-persistent="true"
      aria-label="Persistent Lisp function application stage"
    >
      {@html stageHtml}
    </aside>
  </div>
</main>
