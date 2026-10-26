/* ═══════════════════════════════════════════════════════════════
   Exercises & Concept Reinforcement Engine — SQL In Depth
   ═══════════════════════════════════════════════════════════════ */

window.Exercises = (() => {
  const exerciseBank = {
    "why-databases-exist": {
      title: "ACID Durability vs Ad-Hoc File Overwrites",
      difficulty: "Foundational",
      prompt: "Why does overwriting a JSON/CSV file in place risk silent corruption on power loss, whereas a relational storage engine guarantees atomic durability?",
      scenario: "Updating an account balance from $500 to $400 during an unexpected kernel panic.",
      options: [
        "Because relational databases store all data exclusively in CPU L1 cache.",
        "Because OS write() calls are not atomic across 4KB/8KB disk blocks; relational engines append redo records to a Write-Ahead Log (WAL) with CRC checksums and fsync() before modifying buffered data pages.",
        "Because CSV files cannot store numeric types.",
        "Because SQL queries run on a single thread without OS system calls."
      ],
      answer: 1,
      explanation: "Partial page writes (torn pages) occur when power fails mid-flush. By enforcing the WAL-Before-Data rule (fsyncing sequential redo log records before dirty heap pages), ARIES recovery can deterministically replay committed transactions and undo uncommitted ones."
    },
    "left-right-full-outer-joins": {
      title: "LEFT JOIN Predicate Placement: ON vs WHERE",
      difficulty: "Staff Level",
      prompt: "Given SELECT c.id, o.id FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.status = 'paid', what happens to customers with zero orders?",
      scenario: "Reporting all customers alongside their paid order count.",
      options: [
        "They are included with o.id = NULL.",
        "They are silently eliminated! For unmatched left rows, o.status is NULL; the post-join WHERE o.status = 'paid' evaluates NULL = 'paid' → UNKNOWN, degenerating the LEFT JOIN into an INNER JOIN.",
        "The query throws a syntax error because WHERE cannot reference right-table columns.",
        "The database automatically rewrites WHERE into ON."
      ],
      answer: 1,
      explanation: "Logical execution evaluates FROM/JOIN (and its ON clause) before WHERE. Placing a non-null filter on the nullable right table in WHERE filters out the null-extended rows produced by the LEFT JOIN. Move o.status = 'paid' into the ON clause to preserve unmatched left rows."
    }
  };

  function getExercise(slug) {
    if (exerciseBank[slug]) return exerciseBank[slug];
    const qList = window.QUESTION_BANK?.[slug];
    if (Array.isArray(qList) && qList.length > 0) {
      const q = qList[qList.length - 1];
      if (Array.isArray(q.options) && typeof q.answer === 'number') {
        return {
          title: "SQL Architecture & Engine Check",
          difficulty: q.difficulty === 'staff' ? 'Staff Level' : (q.difficulty === 'apply' ? 'Intermediate' : 'Foundational'),
          prompt: q.question || q.prompt,
          scenario: "Analyze the relational semantics, query plan, and storage engine invariant before selecting.",
          options: q.options,
          answer: q.answer,
          explanation: q.explanation
        };
      }
    }
    return null;
  }

  function renderExercise(slug, unitTitle) {
    const ex = getExercise(slug);
    if (!ex) return '';
    const optionsHtml = ex.options.map((opt, idx) => `
      <button type="button" class="exercise-option" data-action="check-exercise" data-slug="${slug}" data-idx="${idx}" data-ans="${ex.answer}">
        <span class="exercise-option__letter">${String.fromCharCode(65 + idx)}</span>
        <span class="exercise-option__text">${opt}</span>
      </button>
    `).join('');

    return `
      <div class="exercise-card" id="exercise-${slug}">
        <div class="exercise-card__header">
          <span class="exercise-card__badge">Interactive Challenge · ${ex.difficulty}</span>
          <h3 class="exercise-card__title">${ex.title || unitTitle}</h3>
        </div>
        ${ex.scenario ? `<div class="exercise-card__scenario">${ex.scenario}</div>` : ''}
        <p class="exercise-card__prompt">${ex.prompt}</p>
        <div class="exercise-card__options" id="exercise-options-${slug}">
          ${optionsHtml}
        </div>
        <div class="exercise-card__feedback" id="exercise-feedback-${slug}" style="display:none;">
          <div class="exercise-card__explanation">${ex.explanation}</div>
        </div>
      </div>
    `;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="check-exercise"]');
    if (!btn) return;
    const slug = btn.dataset.slug;
    const idx = parseInt(btn.dataset.idx, 10);
    const ans = parseInt(btn.dataset.ans, 10);
    const container = document.getElementById('exercise-options-' + slug);
    const feedback = document.getElementById('exercise-feedback-' + slug);
    if (!container) return;
    container.querySelectorAll('.exercise-option').forEach((b, i) => {
      b.disabled = true;
      if (i === ans) b.classList.add('is-correct');
      else if (i === idx) b.classList.add('is-wrong');
    });
    if (feedback) feedback.style.display = 'block';
  });

  return { renderExercise, getExercise };
})();
