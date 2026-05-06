/**
 * Smoke + form-validation + scoring tests for modus-bg-demo.
 * Run via mcp__Claude_Preview__preview_eval — see tests.run() at bottom.
 *
 * Each assertion returns { name, ok, detail } so we can render a report.
 */
const TESTS = (() => {
  const results = [];
  function check(name, cond, detail = '') {
    results.push({ name, ok: !!cond, detail: cond ? '' : detail });
  }
  function reset() { results.length = 0; }
  function report() {
    const passed = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok);
    return { passed, total: results.length, failed: failed.map(f => `❌ ${f.name} — ${f.detail}`) };
  }

  async function fetchDoc(path) {
    const r = await fetch(path);
    const html = await r.text();
    return new DOMParser().parseFromString(html, 'text/html');
  }

  function testFormRequiredFields(d, formSel, requiredNames, page) {
    const form = d.querySelector(formSel);
    check(`${page} ${formSel} exists`, !!form, `selector not found`);
    if (!form) return;
    requiredNames.forEach(n => {
      const el = form.querySelector(`[name="${n}"]`);
      check(
        `${page} ${formSel} has [name="${n}"][required]`,
        el && el.hasAttribute('required'),
        el ? 'no required attr' : 'field missing'
      );
    });
    const consent = form.querySelector('input[type="checkbox"][name="consent"]');
    check(
      `${page} ${formSel} has consent checkbox required`,
      consent && consent.hasAttribute('required'),
      consent ? 'consent without required' : 'consent missing'
    );
  }

  async function smokeAllPages() {
    const pages = ['/index.html', '/medicine.html', '/stroyka.html', '/it.html', '/tamozhenaya.html', '/privacy.html', '/personal-data-consent.html'];
    for (const p of pages) {
      const r = await fetch(p);
      check(`${p} returns 200`, r.status === 200, `got ${r.status}`);
    }
  }

  async function testHeroForms() {
    for (const p of ['/index.html', '/medicine.html', '/stroyka.html', '/it.html', '/tamozhenaya.html']) {
      const d = await fetchDoc(p);
      testFormRequiredFields(d, 'form.qc-form', ['name', 'phone'], p);
    }
  }

  async function testCtaStrips() {
    for (const p of ['/index.html', '/medicine.html', '/stroyka.html', '/it.html', '/tamozhenaya.html']) {
      const d = await fetchDoc(p);
      const forms = d.querySelectorAll('form.cta-strip-form');
      check(`${p} has at least 1 cta-strip-form`, forms.length >= 1, `found ${forms.length}`);
      forms.forEach((f, idx) => {
        const name = f.querySelector('[name="name"][required]');
        const phone = f.querySelector('[name="phone"][required]');
        const consent = f.querySelector('[name="consent"][required]');
        check(`${p} cta-strip-form[${idx}] has name+phone+consent required`,
              !!(name && phone && consent),
              `name:${!!name} phone:${!!phone} consent:${!!consent}`);
      });
    }
  }

  async function testCalcModal() {
    for (const p of ['/index.html', '/medicine.html', '/stroyka.html', '/it.html']) {
      const d = await fetchDoc(p);
      check(`${p} has calc modal`, !!d.getElementById('calcModal'));
      check(`${p} has calc modal trigger button`, !!d.getElementById('calcCtaBtn'));
      const modalForm = d.querySelector('#calcModal form.modal-form');
      check(`${p} modal has form`, !!modalForm);
      if (modalForm) {
        ['name', 'phone', 'consent'].forEach(n => {
          const el = modalForm.querySelector(`[name="${n}"][required]`);
          check(`${p} modal form has [name="${n}"][required]`, !!el);
        });
      }
    }
  }

  async function testQuizScoringTamozh() {
    // Run tamozhenaya quiz with worst answers, expect prob in [5, 60]
    location.href = '/tamozhenaya.html';
    await new Promise(r => setTimeout(r, 800));
    // Step 1: УЭО + >100 млн
    document.querySelector('input[name="bgtype"][value="ueo"]')?.click();
    document.querySelector('input[name="sumband"][value="gt100"]')?.click();
    document.getElementById('quizNext').click();
    // Step 2
    document.querySelector('input[name="urgency"][value="hot"]')?.click();
    document.querySelector('input[name="term"][value="gt3y"]')?.click();
    document.getElementById('quizNext').click();
    // Step 3: УЭО + молодая + нет аккредитации
    document.querySelector('input[name="vedtype"][value="ueo"]')?.click();
    document.querySelector('input[name="age"][value="lt1y"]')?.click();
    document.querySelector('input[name="fts"][value="no"]')?.click();
    document.getElementById('quizNext').click();
    // Step 4
    document.getElementById('quizName').value = 'Тест';
    document.getElementById('quizName').dispatchEvent(new Event('input'));
    document.getElementById('quizPhone').value = '+79991234567';
    document.getElementById('quizPhone').dispatchEvent(new Event('input'));
    document.querySelector('input[name="contact"][value="call"]')?.click();
    document.getElementById('quizNext').click();

    const prob = parseInt(document.getElementById('qrProb')?.textContent || '999', 10);
    const probClass = document.getElementById('qrStatProb')?.className || '';
    check(`tamozh quiz worst-case prob ≤ 60`, prob >= 5 && prob <= 60, `got ${prob}`);
    check(`tamozh quiz worst-case has color (is-low or is-warn)`, /is-low|is-warn/.test(probClass), `got "${probClass}"`);
  }

  async function testQuizScoringIndexClean() {
    // Index quiz with best answers → 85-95%
    location.href = '/index.html#quiz';
    await new Promise(r => setTimeout(r, 800));
    document.querySelector('input[name="law"][value="44"]')?.click();
    document.getElementById('quizSum').value = '5000000';
    document.getElementById('quizSum').dispatchEvent(new Event('input'));
    document.querySelector('input[name="urgency"][value="planned"]')?.click();
    document.getElementById('quizNext').click();
    document.querySelector('input[name="age"][value="gt1"]')?.click();
    document.getElementById('quizRevenue').value = '50-200';
    document.getElementById('quizRevenue').dispatchEvent(new Event('change'));
    document.querySelector('input[name="profit"][value="yes"]')?.click();
    document.getElementById('quizNext').click();
    document.querySelector('input[name="experience"][value="3plus"]')?.click();
    document.querySelector('input[name="refusals"][value="none"]')?.click();
    document.getElementById('quizNext').click();
    document.querySelector('input[name="redflags"][value="none"]')?.click();
    document.querySelector('input[name="thirdparty"][value="no"]')?.click();
    document.getElementById('quizNext').click();
    const prob = parseInt(document.getElementById('qrProb')?.textContent || '0', 10);
    const probClass = document.getElementById('qrStatProb')?.className || '';
    check(`index quiz clean-case prob ∈ [85, 95]`, prob >= 85 && prob <= 95, `got ${prob}`);
    check(`index quiz clean-case is-high (green)`, /is-high/.test(probClass), `got "${probClass}"`);
  }

  async function testModalOpenClose() {
    location.href = '/index.html';
    await new Promise(r => setTimeout(r, 800));
    const modal = document.getElementById('calcModal');
    const trigger = document.getElementById('calcCtaBtn');
    check('modal initially closed', modal.getAttribute('data-open') === 'false');
    trigger.click();
    check('modal opens on trigger click', modal.getAttribute('data-open') === 'true');
    // close via Esc
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise(r => setTimeout(r, 50));
    check('modal closes on Esc', modal.getAttribute('data-open') === 'false');
    // open and close via backdrop
    trigger.click();
    modal.querySelector('.modal-backdrop').click();
    check('modal closes on backdrop click', modal.getAttribute('data-open') === 'false');
  }

  async function testNoCalcCtaOrphanConsent() {
    // The old orphan consent under calc-cta should now be in the modal, not under the button
    for (const p of ['/index.html', '/medicine.html', '/stroyka.html', '/it.html']) {
      const d = await fetchDoc(p);
      const calcCta = d.querySelector('.calc-cta');
      check(`${p} calc-cta is type=button`, calcCta && calcCta.getAttribute('type') === 'button');
      // No consent label as direct sibling of calc-cta
      const next = calcCta?.nextElementSibling;
      check(`${p} no orphan consent right after calc-cta`,
        !next || !next.classList?.contains('consent'),
        `next sibling: ${next?.tagName} ${next?.className}`);
    }
  }

  async function testTextualChecks() {
    const idx = await fetchDoc('/index.html');
    const idxHtml = idx.documentElement.outerHTML;
    check('index aside has «десятки тысяч»', idxHtml.includes('десятки тысяч выпущенных БГ'));
    check('index has no «Срок подачи в тендер не сдвигается»', !idxHtml.includes('Срок подачи в тендер не сдвигается'));
    check('index has «Без поручительства»', idxHtml.includes('Без поручительства'));

    for (const p of ['/medicine.html', '/stroyka.html', '/it.html', '/tamozhenaya.html']) {
      const d = await fetchDoc(p);
      const h = d.documentElement.outerHTML;
      check(`${p} has «от одного дня с момента регистрации»`, h.includes('от одного дня с момента регистрации'));
    }

    // 615-ПП should be removed from medicine/it (calc + quiz)
    for (const p of ['/medicine.html', '/it.html']) {
      const d = await fetchDoc(p);
      const calc615 = d.querySelector('#lawPills button[data-law="615"]');
      check(`${p} no 615-ПП in calc`, !calc615);
      const quiz615 = d.querySelector('input[name="law"][value="615"]');
      check(`${p} no 615-ПП in quiz`, !quiz615);
    }
    // 615-ПП should remain on index and stroyka
    for (const p of ['/index.html', '/stroyka.html']) {
      const d = await fetchDoc(p);
      check(`${p} has 615-ПП in calc`, !!d.querySelector('#lawPills button[data-law="615"]'));
      check(`${p} has 615-ПП in quiz`, !!d.querySelector('input[name="law"][value="615"]'));
    }
  }

  async function run() {
    reset();
    await smokeAllPages();
    await testHeroForms();
    await testCtaStrips();
    await testCalcModal();
    await testNoCalcCtaOrphanConsent();
    await testTextualChecks();
    await testQuizScoringIndexClean();
    await testQuizScoringTamozh();
    await testModalOpenClose();
    return report();
  }

  return { run };
})();
TESTS.run();
