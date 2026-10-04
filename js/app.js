// Controlador de Interfaz: Control de Préstamos y Adelantos (PrestApp)
document.addEventListener('DOMContentLoaded', () => {
  // Estado de la aplicación
  const state = {
    activeTab: 'diario',
    selectedDate: prestamosManager.getTodayDateString(),
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    editingLoanId: null,
    viewingPerson: null
  };

  // Elementos DOM
  const elements = {
    // Pestañas
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanes: {
      diario: document.getElementById('pane-diario'),
      mensual: document.getElementById('pane-mensual'),
      personas: document.getElementById('pane-personas')
    },

    // Formulario de Registro
    form: document.getElementById('loan-form'),
    inputPerson: document.getElementById('input-person'),
    conceptRowsContainer: document.getElementById('concept-rows-container'),
    btnAddConceptRow: document.getElementById('btn-add-concept-row'),
    formTotalBadge: document.getElementById('form-total-badge'),
    formSubtotalVal: document.getElementById('form-subtotal-val'),
    btnSubmitLoans: document.getElementById('btn-submit-loans'),
    btnSubmitText: document.getElementById('btn-submit-text'),
    inputDate: document.getElementById('input-date'),
    conceptChips: document.querySelectorAll('.concept-chip'),
    peopleDatalist: document.getElementById('people-datalist'),

    // Vista Diaria
    dailyDateTitle: document.getElementById('daily-date-title'),
    dailyDateSub: document.getElementById('daily-date-sub'),
    btnPrevDay: document.getElementById('btn-prev-day'),
    btnNextDay: document.getElementById('btn-next-day'),
    btnToday: document.getElementById('btn-today'),
    dailyTotalAmount: document.getElementById('daily-total-amount'),
    dailyCountSub: document.getElementById('daily-count-sub'),
    dailyLoansList: document.getElementById('daily-loans-list'),
    dailyEmptyMsg: document.getElementById('daily-empty-msg'),
    btnShareDailyWa: document.getElementById('btn-share-daily-wa'),

    // Vista Mensual
    monthlyTitle: document.getElementById('monthly-title'),
    monthlySub: document.getElementById('monthly-sub'),
    btnPrevMonth: document.getElementById('btn-prev-month'),
    btnNextMonth: document.getElementById('btn-next-month'),
    btnCurrentMonth: document.getElementById('btn-current-month'),
    monthlyGrandTotal: document.getElementById('monthly-grand-total'),
    monthlyCountSub: document.getElementById('monthly-count-sub'),
    monthlyPeopleList: document.getElementById('monthly-people-list'),
    monthlyEmptyMsg: document.getElementById('monthly-empty-msg'),
    btnShareMonthlyWa: document.getElementById('btn-share-monthly-wa'),

    // Vista Personas
    allPeopleList: document.getElementById('all-people-list'),
    allPeopleEmptyMsg: document.getElementById('all-people-empty-msg'),
    allPeopleCountBadge: document.getElementById('all-people-count-badge'),

    // Modal de Edición
    modalEdit: document.getElementById('modal-edit'),
    formEdit: document.getElementById('form-edit'),
    editInputId: document.getElementById('edit-loan-id'),
    editInputDate: document.getElementById('edit-date'),
    editInputPerson: document.getElementById('edit-person'),
    editInputConcept: document.getElementById('edit-concept'),
    editInputAmount: document.getElementById('edit-amount'),
    btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),

    // Modal de Detalle Persona
    modalPerson: document.getElementById('modal-person'),
    modalPersonTitle: document.getElementById('modal-person-title'),
    modalPersonTotal: document.getElementById('modal-person-total'),
    modalPersonList: document.getElementById('modal-person-list'),
    btnSharePersonWa: document.getElementById('btn-share-person-wa'),
    btnClosePersonModal: document.getElementById('btn-close-person-modal'),

    // Botón Instalar PWA y Backup
    btnInstallPwa: document.getElementById('btn-install-pwa'),
    btnExportData: document.getElementById('btn-export-data'),
    btnImportData: document.getElementById('btn-import-data'),
    fileInputImport: document.getElementById('file-input-import'),

    // Calculadora Flotante
    btnOpenCalc: document.getElementById('btn-open-calc'),
    modalCalc: document.getElementById('modal-calc'),
    btnCloseCalc: document.getElementById('btn-close-calc'),
    calcHistory: document.getElementById('calc-history'),
    calcResult: document.getElementById('calc-result'),
    btnCalcPaste: document.getElementById('btn-calc-paste'),
    calcBtns: document.querySelectorAll('.calc-btn'),

    // Toast
    toast: document.getElementById('toast-msg')
  };

  // Sonidos Sintetizados (Web Audio API - Sin archivos externos, offline 100%)
  const audioCtx = (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined')
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

  function playTone(freq = 600, duration = 0.08, type = 'sine') {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  function playSuccessSound() {
    playTone(523.25, 0.06); // Do
    setTimeout(() => playTone(659.25, 0.09), 60); // Mi
  }

  function playDeleteSound() {
    playTone(330, 0.08, 'triangle');
    setTimeout(() => playTone(220, 0.12, 'triangle'), 70);
  }

  function vibrate(ms = 35) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(ms); } catch (e) {}
    }
  }

  // Notificación Toast
  let toastTimer = null;
  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2800);
  }

  // Formato de Moneda
  function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €';
  }

  // Formato de Fecha Legible
  function formatDateReadable(dateStr) {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m - 1, d);
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${days[dt.getDay()]}, ${d} ${months[m - 1]} ${y}`;
      }
    } catch (e) {}
    return dateStr;
  }

  // Inicializar Fecha por Defecto en Formulario
  if (elements.inputDate) {
    elements.inputDate.value = state.selectedDate;
  }

  // Actualizar Autocompletado de Personas
  function updatePeopleDatalist() {
    if (!elements.peopleDatalist) return;
    const people = prestamosManager.getAllPeople();
    elements.peopleDatalist.innerHTML = '';
    people.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      elements.peopleDatalist.appendChild(opt);
    });
  }

  // ==========================================================
  // RENDERIZADO DE VISTAS
  // ==========================================================

  // Renderizar Vista Diaria
  function renderDailyView() {
    const daily = prestamosManager.getDailyLoans(state.selectedDate);

    // Encabezado selector de fecha
    if (elements.dailyDateTitle) {
      elements.dailyDateTitle.textContent = formatDateReadable(state.selectedDate);
    }
    const isToday = state.selectedDate === prestamosManager.getTodayDateString();
    if (elements.dailyDateSub) {
      elements.dailyDateSub.textContent = isToday ? '📅 Hoy' : 'Fecha seleccionada';
      elements.dailyDateSub.style.color = isToday ? 'var(--emerald)' : 'var(--sky)';
    }

    // Totales diarios
    if (elements.dailyTotalAmount) {
      elements.dailyTotalAmount.textContent = formatMoney(daily.totalAmount);
    }
    if (elements.dailyCountSub) {
      elements.dailyCountSub.textContent = daily.count === 1
        ? '1 préstamo o adelanto registrado'
        : `${daily.count} préstamos o adelantos registrados`;
    }

    // Lista de préstamos
    if (!elements.dailyLoansList) return;
    elements.dailyLoansList.innerHTML = '';

    if (daily.items.length === 0) {
      if (elements.dailyEmptyMsg) elements.dailyEmptyMsg.style.display = 'block';
    } else {
      if (elements.dailyEmptyMsg) elements.dailyEmptyMsg.style.display = 'none';

      daily.items.forEach(loan => {
        const itemEl = document.createElement('div');
        itemEl.className = 'loan-item-card';

        const initial = loan.person.charAt(0).toUpperCase();

        itemEl.innerHTML = `
          <div class="loan-item-left">
            <div class="loan-avatar">${initial}</div>
            <div class="loan-meta">
              <span class="loan-person-name">${escapeHtml(loan.person)}</span>
              <span class="loan-concept-tag">🏷️ ${escapeHtml(loan.concept)}</span>
            </div>
          </div>
          <div class="loan-item-right">
            <span class="loan-amount-badge">${formatMoney(loan.amount)}</span>
            <button class="btn-icon-action btn-edit" title="Editar préstamo" data-id="${loan.id}">✏️</button>
            <button class="btn-icon-action delete btn-delete" title="Eliminar" data-id="${loan.id}">🗑️</button>
          </div>
        `;

        // Eventos de edición y borrado
        const btnEdit = itemEl.querySelector('.btn-edit');
        btnEdit.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditModal(loan.id);
        });

        const btnDel = itemEl.querySelector('.btn-delete');
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          confirmDeleteLoan(loan.id, loan.person, loan.amount);
        });

        elements.dailyLoansList.appendChild(itemEl);
      });
    }
  }

  // Renderizar Vista Mensual
  function renderMonthlyView() {
    const monthly = prestamosManager.getMonthlySummary(state.selectedYear, state.selectedMonth);

    if (elements.monthlyTitle) {
      elements.monthlyTitle.textContent = `${monthly.monthName} ${state.selectedYear}`;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const isCurrent = state.selectedYear === currentYear && state.selectedMonth === currentMonth;
    if (elements.monthlySub) {
      elements.monthlySub.textContent = isCurrent ? '🗓️ Mes en curso' : 'Mes consultado';
      elements.monthlySub.style.color = isCurrent ? 'var(--emerald)' : 'var(--gold)';
    }

    if (elements.monthlyGrandTotal) {
      elements.monthlyGrandTotal.textContent = formatMoney(monthly.grandTotal);
    }
    if (elements.monthlyCountSub) {
      elements.monthlyCountSub.textContent = monthly.totalCount === 1
        ? '1 movimiento total este mes'
        : `${monthly.totalCount} movimientos totales este mes`;
    }

    if (!elements.monthlyPeopleList) return;
    elements.monthlyPeopleList.innerHTML = '';

    if (monthly.byPerson.length === 0) {
      if (elements.monthlyEmptyMsg) elements.monthlyEmptyMsg.style.display = 'block';
    } else {
      if (elements.monthlyEmptyMsg) elements.monthlyEmptyMsg.style.display = 'none';

      const maxPersonAmount = monthly.byPerson[0].totalAmount || 1;

      monthly.byPerson.forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'person-monthly-card';

        let medal = `${idx + 1}º`;
        if (idx === 0) medal = '🥇';
        else if (idx === 1) medal = '🥈';
        else if (idx === 2) medal = '🥉';

        const percentage = Math.round((p.totalAmount / maxPersonAmount) * 100);
        const percentOfTotal = monthly.grandTotal > 0
          ? Math.round((p.totalAmount / monthly.grandTotal) * 100)
          : 0;

        card.innerHTML = `
          <div class="person-monthly-top">
            <span class="person-monthly-rank">${medal}</span>
            <span class="person-monthly-name">${escapeHtml(p.person)}</span>
            <span class="person-monthly-amount">${formatMoney(p.totalAmount)}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="person-monthly-bottom">
            <span>${p.count} ${p.count === 1 ? 'apunte' : 'apuntes'} (${percentOfTotal}% del mes)</span>
            <span style="color: var(--sky); font-weight: 700;">Ver detalle ➔</span>
          </div>
        `;

        card.addEventListener('click', () => {
          openPersonModal(p.person);
        });

        elements.monthlyPeopleList.appendChild(card);
      });
    }
  }

  // Renderizar Vista Todas las Personas
  function renderAllPeopleView() {
    const people = prestamosManager.getAllPeople();

    if (elements.allPeopleCountBadge) {
      elements.allPeopleCountBadge.textContent = `${people.length} personas`;
    }

    if (!elements.allPeopleList) return;
    elements.allPeopleList.innerHTML = '';

    if (people.length === 0) {
      if (elements.allPeopleEmptyMsg) elements.allPeopleEmptyMsg.style.display = 'block';
    } else {
      if (elements.allPeopleEmptyMsg) elements.allPeopleEmptyMsg.style.display = 'none';

      // Calcular total acumulado histórico por persona
      const totalsMap = {};
      prestamosManager.loans.forEach(l => {
        const key = l.person.toLowerCase();
        if (!totalsMap[key]) totalsMap[key] = { amount: 0, count: 0 };
        totalsMap[key].amount += l.amount;
        totalsMap[key].count++;
      });

      people.forEach(personName => {
        const pData = totalsMap[personName.toLowerCase()] || { amount: 0, count: 0 };
        const initial = personName.charAt(0).toUpperCase();

        const card = document.createElement('div');
        card.className = 'loan-item-card';
        card.style.cursor = 'pointer';

        card.innerHTML = `
          <div class="loan-item-left">
            <div class="loan-avatar">${initial}</div>
            <div class="loan-meta">
              <span class="loan-person-name">${escapeHtml(personName)}</span>
              <span class="loan-concept-tag">${pData.count} ${pData.count === 1 ? 'movimiento total' : 'movimientos totales'}</span>
            </div>
          </div>
          <div class="loan-item-right">
            <span class="loan-amount-badge">${formatMoney(pData.amount)}</span>
            <span style="color: var(--sky); font-size: 1.1rem;">➔</span>
          </div>
        `;

        card.addEventListener('click', () => {
          openPersonModal(personName);
        });

        elements.allPeopleList.appendChild(card);
      });
    }
  }

  // Re-renderizar todo
  function renderAll() {
    updatePeopleDatalist();
    renderDailyView();
    renderMonthlyView();
    renderAllPeopleView();
  }

  // ==========================================================
  // EVENTOS DE NAVEGACIÓN ENTRE PESTAÑAS
  // ==========================================================
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      if (!targetTab || targetTab === state.activeTab) return;

      vibrate(15);
      elements.navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      Object.keys(elements.tabPanes).forEach(paneKey => {
        if (elements.tabPanes[paneKey]) {
          elements.tabPanes[paneKey].classList.remove('active');
        }
      });

      if (elements.tabPanes[targetTab]) {
        elements.tabPanes[targetTab].classList.add('active');
      }

      state.activeTab = targetTab;
      renderAll();
    });
  });

  // ==========================================================
  // GESTIÓN DINÁMICA DE MÚLTIPLES CONCEPTOS POR APUNTE
  // ==========================================================
  let conceptRowCount = 0;
  let lastFocusedAmountInput = null;

  function createConceptRow(concept = 'Adelanto', amount = '') {
    conceptRowCount++;
    const row = document.createElement('div');
    row.className = 'concept-row-item';
    row.id = `concept-row-${Date.now()}-${conceptRowCount}`;

    row.innerHTML = `
      <div class="concept-row-inputs">
        <input type="text" class="form-input row-concept" placeholder="Gasto / Motivo" value="${escapeHtml(concept)}" required>
        <div class="row-amount-wrap">
          <input type="number" class="form-input row-amount" placeholder="0.00" step="0.01" min="0.01" value="${amount}" required inputmode="decimal">
          <span class="currency-symbol">€</span>
        </div>
      </div>
      <button type="button" class="btn-remove-row" title="Quitar concepto">✕</button>
    `;

    const inputConceptEl = row.querySelector('.row-concept');
    const inputAmountEl = row.querySelector('.row-amount');
    const btnRemove = row.querySelector('.btn-remove-row');

    inputAmountEl.addEventListener('focus', () => {
      lastFocusedAmountInput = inputAmountEl;
    });

    inputAmountEl.addEventListener('input', updateFormSubtotal);
    inputConceptEl.addEventListener('input', updateFormSubtotal);

    btnRemove.addEventListener('click', () => {
      if (!elements.conceptRowsContainer) return;
      const allRows = elements.conceptRowsContainer.querySelectorAll('.concept-row-item');
      if (allRows.length > 1) {
        row.remove();
        vibrate(15);
        updateFormSubtotal();
        updateRemoveButtonsVisibility();
      } else {
        inputConceptEl.value = 'Adelanto';
        inputAmountEl.value = '';
        updateFormSubtotal();
      }
    });

    if (elements.conceptRowsContainer) {
      elements.conceptRowsContainer.appendChild(row);
      updateRemoveButtonsVisibility();
      updateFormSubtotal();
    }
    return { row, inputConceptEl, inputAmountEl };
  }

  function updateRemoveButtonsVisibility() {
    if (!elements.conceptRowsContainer) return;
    const allRows = elements.conceptRowsContainer.querySelectorAll('.concept-row-item');
    allRows.forEach(r => {
      const btn = r.querySelector('.btn-remove-row');
      if (btn) {
        btn.style.display = allRows.length > 1 ? 'flex' : 'none';
      }
    });
  }

  function updateFormSubtotal() {
    if (!elements.conceptRowsContainer) return;
    const rows = elements.conceptRowsContainer.querySelectorAll('.concept-row-item');
    let total = 0;
    let validCount = 0;

    rows.forEach(r => {
      const amt = parseFloat(r.querySelector('.row-amount').value);
      if (!isNaN(amt) && amt > 0) {
        total += amt;
        validCount++;
      }
    });

    if (elements.formTotalBadge) {
      if (rows.length > 1 || validCount > 0) {
        elements.formTotalBadge.style.display = 'flex';
        if (elements.formSubtotalVal) elements.formSubtotalVal.textContent = formatMoney(total);
      } else {
        elements.formTotalBadge.style.display = 'none';
      }
    }

    if (elements.btnSubmitText) {
      if (rows.length > 1) {
        elements.btnSubmitText.textContent = `GUARDAR ${rows.length} CONCEPTOS (${formatMoney(total)})`;
      } else {
        elements.btnSubmitText.textContent = total > 0
          ? `GUARDAR APUNTE (${formatMoney(total)})`
          : 'GUARDAR APUNTE';
      }
    }
  }

  function resetConceptRows() {
    if (!elements.conceptRowsContainer) return;
    elements.conceptRowsContainer.innerHTML = '';
    createConceptRow('Adelanto', '');
  }

  // Botón para añadir otra fila de concepto manualmente
  if (elements.btnAddConceptRow) {
    elements.btnAddConceptRow.addEventListener('click', () => {
      vibrate(20);
      playTone(600, 0.05);
      const newRow = createConceptRow('Adelanto', '');
      newRow.inputAmountEl.focus();
    });
  }

  // ==========================================================
  // CHIPS DE CONCEPTOS RÁPIDOS
  // ==========================================================
  elements.conceptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-concept') || chip.textContent.trim();
      vibrate(20);
      playTone(700, 0.05);

      if (!elements.conceptRowsContainer) return;
      const rows = elements.conceptRowsContainer.querySelectorAll('.concept-row-item');
      const lastRow = rows[rows.length - 1];
      const lastConceptInput = lastRow ? lastRow.querySelector('.row-concept') : null;
      const lastAmountInput = lastRow ? lastRow.querySelector('.row-amount') : null;

      // Si la última fila ya tiene importe, añadir una nueva fila con este concepto
      if (lastAmountInput && lastAmountInput.value.trim() !== '') {
        const newRow = createConceptRow(text, '');
        newRow.inputAmountEl.focus();
        showToast(`➕ Añadido: ${text}`);
      } else {
        // Asignar a la fila actual
        if (lastConceptInput) lastConceptInput.value = text;
        if (lastAmountInput) lastAmountInput.focus();
      }
      updateFormSubtotal();
    });
  });

  // ==========================================================
  // FORMULARIO: REGISTRO DE PRÉSTAMOS / GASTOS
  // ==========================================================
  if (elements.form) {
    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();

      const person = elements.inputPerson ? elements.inputPerson.value.trim() : '';
      const dateVal = (elements.inputDate && elements.inputDate.value)
        ? elements.inputDate.value
        : state.selectedDate;

      if (!person) {
        showToast('⚠️ Introduce el nombre de la persona');
        if (elements.inputPerson) elements.inputPerson.focus();
        return;
      }

      if (!elements.conceptRowsContainer) return;
      const rows = elements.conceptRowsContainer.querySelectorAll('.concept-row-item');
      const itemsToSave = [];

      for (let i = 0; i < rows.length; i++) {
        const cVal = rows[i].querySelector('.row-concept').value.trim() || 'Adelanto';
        const aVal = parseFloat(rows[i].querySelector('.row-amount').value);

        if (isNaN(aVal) || aVal <= 0) {
          showToast(`⚠️ Revisa el valor del concepto #${i + 1}`);
          rows[i].querySelector('.row-amount').focus();
          return;
        }

        itemsToSave.push({ concept: cVal, amount: aVal });
      }

      try {
        prestamosManager.addMultipleLoans(dateVal, person, itemsToSave);

        state.selectedDate = dateVal;
        const [y, m] = dateVal.split('-').map(Number);
        if (y && m) {
          state.selectedYear = y;
          state.selectedMonth = m;
        }

        playSuccessSound();
        vibrate(40);

        const totalSaved = itemsToSave.reduce((s, it) => s + it.amount, 0);
        const msg = itemsToSave.length === 1
          ? `✅ Guardado: ${person} - ${formatMoney(totalSaved)}`
          : `✅ Guardados ${itemsToSave.length} conceptos para ${person} (${formatMoney(totalSaved)})`;
        showToast(msg);

        // Resetear conceptos y mantener foco en persona para el siguiente registro
        resetConceptRows();
        if (elements.inputPerson) elements.inputPerson.focus();

        renderAll();
      } catch (err) {
        showToast(`❌ Error: ${err.message}`);
      }
    });
  }

  // ==========================================================
  // CONTROL DE FECHAS DIARIAS
  // ==========================================================
  function changeDateByOffset(days) {
    const [y, m, d] = state.selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);

    const newY = dt.getFullYear();
    const newM = String(dt.getMonth() + 1).padStart(2, '0');
    const newD = String(dt.getDate()).padStart(2, '0');
    state.selectedDate = `${newY}-${newM}-${newD}`;

    if (elements.inputDate) {
      elements.inputDate.value = state.selectedDate;
    }

    state.selectedYear = newY;
    state.selectedMonth = parseInt(newM, 10);

    vibrate(15);
    renderAll();
  }

  if (elements.btnPrevDay) {
    elements.btnPrevDay.addEventListener('click', () => changeDateByOffset(-1));
  }
  if (elements.btnNextDay) {
    elements.btnNextDay.addEventListener('click', () => changeDateByOffset(1));
  }
  if (elements.btnToday) {
    elements.btnToday.addEventListener('click', () => {
      state.selectedDate = prestamosManager.getTodayDateString();
      if (elements.inputDate) elements.inputDate.value = state.selectedDate;
      const [y, m] = state.selectedDate.split('-').map(Number);
      state.selectedYear = y;
      state.selectedMonth = m;
      vibrate(25);
      renderAll();
    });
  }

  // ==========================================================
  // CONTROL DE MESES
  // ==========================================================
  function changeMonthByOffset(offset) {
    let m = state.selectedMonth + offset;
    let y = state.selectedYear;
    if (m < 1) {
      m = 12;
      y--;
    } else if (m > 12) {
      m = 1;
      y++;
    }
    state.selectedMonth = m;
    state.selectedYear = y;
    vibrate(15);
    renderMonthlyView();
  }

  if (elements.btnPrevMonth) {
    elements.btnPrevMonth.addEventListener('click', () => changeMonthByOffset(-1));
  }
  if (elements.btnNextMonth) {
    elements.btnNextMonth.addEventListener('click', () => changeMonthByOffset(1));
  }
  if (elements.btnCurrentMonth) {
    elements.btnCurrentMonth.addEventListener('click', () => {
      state.selectedYear = new Date().getFullYear();
      state.selectedMonth = new Date().getMonth() + 1;
      vibrate(25);
      renderMonthlyView();
    });
  }

  // ==========================================================
  // MODAL DE EDICIÓN
  // ==========================================================
  function openEditModal(loanId) {
    const loan = prestamosManager.getLoanById(loanId);
    if (!loan) return;

    state.editingLoanId = loanId;
    if (elements.editInputId) elements.editInputId.value = loan.id;
    if (elements.editInputDate) elements.editInputDate.value = loan.date;
    if (elements.editInputPerson) elements.editInputPerson.value = loan.person;
    if (elements.editInputConcept) elements.editInputConcept.value = loan.concept;
    if (elements.editInputAmount) elements.editInputAmount.value = loan.amount;

    if (elements.modalEdit) elements.modalEdit.classList.add('open');
  }

  function closeEditModal() {
    state.editingLoanId = null;
    if (elements.modalEdit) elements.modalEdit.classList.remove('open');
  }

  if (elements.btnCloseEditModal) elements.btnCloseEditModal.addEventListener('click', closeEditModal);
  if (elements.btnCancelEdit) elements.btnCancelEdit.addEventListener('click', closeEditModal);

  if (elements.formEdit) {
    elements.formEdit.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.editingLoanId) return;

      const updatedDate = elements.editInputDate.value;
      const updatedPerson = elements.editInputPerson.value.trim();
      const updatedConcept = elements.editInputConcept.value.trim();
      const updatedAmount = parseFloat(elements.editInputAmount.value);

      if (!updatedPerson) {
        showToast('⚠️ El nombre no puede estar vacío');
        return;
      }
      if (isNaN(updatedAmount) || updatedAmount <= 0) {
        showToast('⚠️ Introduce un importe válido');
        return;
      }

      const ok = prestamosManager.editLoan(state.editingLoanId, {
        date: updatedDate,
        person: updatedPerson,
        concept: updatedConcept,
        amount: updatedAmount
      });

      if (ok) {
        playSuccessSound();
        showToast('✏️ Préstamo actualizado correctamente');
        closeEditModal();
        renderAll();
      } else {
        showToast('❌ Error al editar el préstamo');
      }
    });
  }

  // Confirmar y eliminar préstamo
  function confirmDeleteLoan(id, person, amount) {
    if (confirm(`¿Eliminar el registro de ${person} por ${formatMoney(amount)}?`)) {
      prestamosManager.deleteLoan(id);
      playDeleteSound();
      vibrate(50);
      showToast('🗑️ Registro eliminado');
      renderAll();
    }
  }

  // ==========================================================
  // MODAL DE DETALLE POR PERSONA
  // ==========================================================
  function openPersonModal(personName) {
    state.viewingPerson = personName;
    const summary = prestamosManager.getMonthlySummary(state.selectedYear, state.selectedMonth);
    const target = summary.byPerson.find(p => p.person.toLowerCase() === personName.toLowerCase());

    if (elements.modalPersonTitle) {
      elements.modalPersonTitle.textContent = `👤 ${personName}`;
    }

    const totalAmt = target ? target.totalAmount : 0;
    if (elements.modalPersonTotal) {
      elements.modalPersonTotal.textContent = `Total en ${summary.monthName}: ${formatMoney(totalAmt)}`;
    }

    if (elements.modalPersonList) {
      elements.modalPersonList.innerHTML = '';
      if (!target || target.items.length === 0) {
        elements.modalPersonList.innerHTML = `<p style="color: var(--text-dim); text-align: center; padding: 20px 0;">No hay movimientos este mes.</p>`;
      } else {
        target.items.forEach(item => {
          const row = document.createElement('div');
          row.className = 'loan-item-card';
          row.style.background = 'var(--bg-elevated)';
          row.innerHTML = `
            <div class="loan-item-left">
              <div class="loan-meta">
                <span class="loan-person-name" style="font-size: 0.88rem;">📅 ${item.date}</span>
                <span class="loan-concept-tag">${escapeHtml(item.concept)}</span>
              </div>
            </div>
            <div class="loan-item-right">
              <span class="loan-amount-badge" style="font-size: 1rem;">${formatMoney(item.amount)}</span>
            </div>
          `;
          elements.modalPersonList.appendChild(row);
        });
      }
    }

    if (elements.modalPerson) elements.modalPerson.classList.add('open');
  }

  function closePersonModal() {
    state.viewingPerson = null;
    if (elements.modalPerson) elements.modalPerson.classList.remove('open');
  }

  if (elements.btnClosePersonModal) elements.btnClosePersonModal.addEventListener('click', closePersonModal);

  // Cerrar modales al hacer clic fuera
  window.addEventListener('click', (e) => {
    if (e.target === elements.modalEdit) closeEditModal();
    if (e.target === elements.modalPerson) closePersonModal();
    if (e.target === elements.modalCalc) closeCalcModal();
  });

  // ==========================================================
  // COMPARTIR POR WHATSAPP
  // ==========================================================
  function shareViaWhatsApp(text) {
    vibrate(25);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  if (elements.btnShareDailyWa) {
    elements.btnShareDailyWa.addEventListener('click', () => {
      const text = prestamosManager.getDailyWhatsAppText(state.selectedDate);
      shareViaWhatsApp(text);
    });
  }

  if (elements.btnShareMonthlyWa) {
    elements.btnShareMonthlyWa.addEventListener('click', () => {
      const text = prestamosManager.getMonthlyWhatsAppText(state.selectedYear, state.selectedMonth);
      shareViaWhatsApp(text);
    });
  }

  if (elements.btnSharePersonWa) {
    elements.btnSharePersonWa.addEventListener('click', () => {
      if (!state.viewingPerson) return;
      const text = prestamosManager.getPersonWhatsAppText(state.viewingPerson, state.selectedYear, state.selectedMonth);
      shareViaWhatsApp(text);
    });
  }

  // ==========================================================
  // COPIAS DE SEGURIDAD (EXPORTAR E IMPORTAR JSON)
  // ==========================================================
  if (elements.btnExportData) {
    elements.btnExportData.addEventListener('click', () => {
      const exportObj = {
        app: 'ControlDePrestamosYAdelantos',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        loans: prestamosManager.loans
      };
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `copia_seguridad_prestamos_${prestamosManager.getTodayDateString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('📥 Copia de seguridad descargada');
    });
  }

  if (elements.btnImportData && elements.fileInputImport) {
    elements.btnImportData.addEventListener('click', () => {
      elements.fileInputImport.click();
    });

    elements.fileInputImport.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed && Array.isArray(parsed.loans)) {
            prestamosManager.loans = parsed.loans;
            prestamosManager.save();
            renderAll();
            showToast(`✅ Se importaron ${parsed.loans.length} registros con éxito`);
          } else {
            showToast('⚠️ El archivo no contiene datos de préstamos válidos');
          }
        } catch (err) {
          showToast('❌ Error al procesar el archivo JSON');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  // ==========================================================
  // INSTALACIÓN PWA (ANDROID & PC)
  // ==========================================================
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (elements.btnInstallPwa) {
      elements.btnInstallPwa.style.display = 'inline-flex';
    }
  });

  if (elements.btnInstallPwa) {
    elements.btnInstallPwa.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('📲 ¡Aplicación instalada!');
        }
        deferredPrompt = null;
        elements.btnInstallPwa.style.display = 'none';
      } else {
        alert('Para instalar en iPhone/iPad:\nToca el botón de Compartir en Safari (icono de cuadrado con flecha hacia arriba) y selecciona "Añadir a pantalla de inicio".\n\nEn Android/Chrome:\nToca en el menú de 3 puntos arriba a la derecha y selecciona "Instalar aplicación".');
      }
    });
  }

  // Registrar Service Worker para soporte Offline
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('ServiceWorker registrado correctamente'))
      .catch(err => console.log('Error registrando ServiceWorker:', err));
  }

  // ==========================================================
  // CALCULADORA FLOTANTE
  // ==========================================================
  const calcState = {
    current: '0',
    prev: null,
    op: null,
    resetNext: false
  };

  function updateCalcDisplay() {
    if (elements.calcResult) {
      elements.calcResult.textContent = calcState.current;
    }
    if (elements.calcHistory) {
      if (calcState.prev !== null && calcState.op) {
        const opSymbol = calcState.op === '*' ? '×' : (calcState.op === '/' ? '÷' : calcState.op);
        elements.calcHistory.textContent = `${calcState.prev} ${opSymbol}`;
      } else {
        elements.calcHistory.textContent = '';
      }
    }
  }

  function calcInputDigit(digit) {
    if (calcState.resetNext) {
      calcState.current = digit === '.' ? '0.' : digit;
      calcState.resetNext = false;
    } else {
      if (digit === '.') {
        if (!calcState.current.includes('.')) {
          calcState.current += '.';
        }
      } else {
        if (calcState.current === '0') {
          calcState.current = digit;
        } else {
          calcState.current += digit;
        }
      }
    }
    vibrate(12);
    playTone(550, 0.04);
    updateCalcDisplay();
  }

  function calcPerformOp() {
    if (calcState.prev === null || calcState.op === null) return;
    const a = parseFloat(calcState.prev);
    const b = parseFloat(calcState.current);
    if (isNaN(a) || isNaN(b)) return;

    let res = 0;
    if (calcState.op === '+') res = a + b;
    else if (calcState.op === '-') res = a - b;
    else if (calcState.op === '*') res = a * b;
    else if (calcState.op === '/') res = b !== 0 ? (a / b) : 0;

    // Redondear a 4 decimales si tiene decimales largos para evitar 0.30000000004
    res = Math.round(res * 10000) / 10000;
    calcState.current = String(res);
    calcState.prev = null;
    calcState.op = null;
    calcState.resetNext = true;
  }

  function calcSetOperator(op) {
    if (calcState.op && !calcState.resetNext) {
      calcPerformOp();
    }
    calcState.prev = calcState.current;
    calcState.op = op;
    calcState.resetNext = true;
    vibrate(15);
    playTone(620, 0.05);
    updateCalcDisplay();
  }

  function calcEquals() {
    if (!calcState.op) return;
    calcPerformOp();
    vibrate(20);
    playTone(720, 0.07);
    updateCalcDisplay();
  }

  function calcClear() {
    calcState.current = '0';
    calcState.prev = null;
    calcState.op = null;
    calcState.resetNext = false;
    vibrate(25);
    playTone(380, 0.06);
    updateCalcDisplay();
  }

  function calcBackspace() {
    if (calcState.resetNext) return;
    if (calcState.current.length > 1) {
      calcState.current = calcState.current.slice(0, -1);
    } else {
      calcState.current = '0';
    }
    vibrate(12);
    updateCalcDisplay();
  }

  function calcToggleSign() {
    if (calcState.current !== '0') {
      if (calcState.current.startsWith('-')) {
        calcState.current = calcState.current.slice(1);
      } else {
        calcState.current = '-' + calcState.current;
      }
      updateCalcDisplay();
    }
  }

  function openCalcModal() {
    if (elements.modalCalc) elements.modalCalc.classList.add('open');
    updateCalcDisplay();
    vibrate(20);
  }

  function closeCalcModal() {
    if (elements.modalCalc) elements.modalCalc.classList.remove('open');
  }

  if (elements.btnOpenCalc) elements.btnOpenCalc.addEventListener('click', openCalcModal);
  if (elements.btnCloseCalc) elements.btnCloseCalc.addEventListener('click', closeCalcModal);

  // Botón "Copiar al Valor del Apunte (€)"
  if (elements.btnCalcPaste) {
    elements.btnCalcPaste.addEventListener('click', () => {
      // Si todavía hay operación pendiente, calcularla primero
      if (calcState.op) {
        calcPerformOp();
        updateCalcDisplay();
      }

      const val = parseFloat(calcState.current);
      if (!isNaN(val) && val > 0) {
        // Si el modal de edición está abierto, copiar en el modal de edición
        if (state.editingLoanId && elements.editInputAmount) {
          elements.editInputAmount.value = val.toFixed(2);
        } else {
          // Copiar en el input de importe enfocado o en la última fila
          let targetInput = lastFocusedAmountInput;
          if (!targetInput || !document.body.contains(targetInput)) {
            const rows = elements.conceptRowsContainer ? elements.conceptRowsContainer.querySelectorAll('.concept-row-item') : [];
            if (rows.length > 0) {
              targetInput = rows[rows.length - 1].querySelector('.row-amount');
            }
          }
          if (targetInput) {
            targetInput.value = val.toFixed(2);
            updateFormSubtotal();
          }
          // Si estamos en otra pestaña, cambiar a pestaña diario
          if (state.activeTab !== 'diario') {
            const tabDiarioBtn = document.querySelector('.nav-tab[data-tab="diario"]');
            if (tabDiarioBtn) tabDiarioBtn.click();
          }
        }

        playSuccessSound();
        vibrate(35);
        showToast(`💰 Valor copiado: ${val.toFixed(2)} €`);
        closeCalcModal();
      } else {
        showToast('⚠️ El resultado debe ser un número mayor a 0');
      }
    });
  }

  // Eventos de botones de la calculadora
  elements.calcBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const num = btn.getAttribute('data-num');
      const op = btn.getAttribute('data-op');
      const action = btn.getAttribute('data-action');

      if (num !== null) {
        calcInputDigit(num);
      } else if (op) {
        calcSetOperator(op);
      } else if (action === 'clear') {
        calcClear();
      } else if (action === 'backspace') {
        calcBackspace();
      } else if (action === 'sign') {
        calcToggleSign();
      } else if (action === 'equals') {
        calcEquals();
      }
    });
  });

  // Soporte de teclado para la calculadora cuando el modal está abierto
  window.addEventListener('keydown', (e) => {
    if (!elements.modalCalc || !elements.modalCalc.classList.contains('open')) return;

    if (e.key >= '0' && e.key <= '9') {
      calcInputDigit(e.key);
    } else if (e.key === '.' || e.key === ',') {
      calcInputDigit('.');
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      calcSetOperator(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calcEquals();
    } else if (e.key === 'Backspace') {
      calcBackspace();
    } else if (e.key === 'Escape') {
      closeCalcModal();
    } else if (e.key === 'c' || e.key === 'C') {
      calcClear();
    }
  });

  // Escapar HTML auxiliar
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }

  // Inicialización de filas y render inicial
  resetConceptRows();
  renderAll();
});
