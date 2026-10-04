// Motor Lógico de Control de Préstamos y Adelantos (PrestApp)
// 100% Gratuito, Sin Servidores de Pago, Almacenamiento Local Seguro

const safeStorage = {
  _mem: {},
  getItem(key) {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return this._mem[key] || null;
  },
  setItem(key, val) {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.setItem(key, val);
        return;
      }
    } catch (e) {}
    this._mem[key] = String(val);
  }
};

if (typeof window !== 'undefined') {
  window.safeStorage = safeStorage;
}

class PrestamosManager {
  constructor() {
    this.storageKey = 'control_prestamos_data_v1';

    // Lista de préstamos y adelantos registrados
    this.loans = [];

    // Conceptos rápidos habituales
    this.defaultConcepts = [
      'Adelanto',
      'Gasolina',
      'Comida',
      'Reparación',
      'Material',
      'Préstamo personal',
      'Dietas',
      'Varios'
    ];

    this.load();
  }

  save() {
    try {
      safeStorage.setItem(this.storageKey, JSON.stringify({
        loans: this.loans
      }));
    } catch (e) {
      console.warn('Error al guardar datos de préstamos', e);
    }
  }

  load() {
    try {
      const data = safeStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.loans && Array.isArray(parsed.loans)) {
          this.loans = parsed.loans;
        }
      }
    } catch (e) {
      console.warn('Error al cargar datos de préstamos', e);
    }
  }

  // --- GESTIÓN DE PRÉSTAMOS (CRUD) ---

  /**
   * Añadir un nuevo préstamo o adelanto
   */
  addLoan(dateStr, personName, concept, amount) {
    const trimmedPerson = (personName || '').trim();
    const trimmedConcept = (concept || 'Préstamo').trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedPerson) throw new Error('El nombre de la persona es obligatorio');
    if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('El valor debe ser un número mayor a 0');

    const newLoan = {
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      date: dateStr || this.getTodayDateString(),
      person: trimmedPerson,
      concept: trimmedConcept,
      amount: parsedAmount,
      createdAt: new Date().toISOString()
    };

    this.loans.unshift(newLoan); // El más reciente primero
    this.save();
    return newLoan;
  }

  /**
   * Editar un préstamo existente
   */
  editLoan(id, updatedData) {
    const item = this.loans.find(x => x.id === id);
    if (!item) return false;

    if (updatedData.person !== undefined) {
      const p = (updatedData.person || '').trim();
      if (p) item.person = p;
    }
    if (updatedData.concept !== undefined) {
      const c = (updatedData.concept || '').trim();
      if (c) item.concept = c;
    }
    if (updatedData.amount !== undefined) {
      const amt = parseFloat(updatedData.amount);
      if (!isNaN(amt) && amt > 0) item.amount = amt;
    }
    if (updatedData.date !== undefined && updatedData.date) {
      item.date = updatedData.date;
    }

    this.save();
    return true;
  }

  /**
   * Eliminar un préstamo
   */
  deleteLoan(id) {
    const index = this.loans.findIndex(x => x.id === id);
    if (index !== -1) {
      this.loans.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  getLoanById(id) {
    return this.loans.find(x => x.id === id) || null;
  }

  // --- CONSULTAS Y SUMATORIOS DIARIOS ---

  /**
   * Obtiene todos los préstamos de un día y calcula el sumatorio total
   */
  getDailyLoans(dateStr) {
    const items = this.loans.filter(l => l.date === dateStr);
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    return {
      date: dateStr,
      items,
      totalAmount,
      count: items.length
    };
  }

  // --- CONSULTAS Y SUMATORIOS MENSUALES ---

  /**
   * Obtiene el sumatorio del mes y el desglose acumulado por persona
   * @param {number} year - Ej: 2026
   * @param {number} month - 1 a 12
   */
  getMonthlySummary(year, month) {
    const padMonth = String(month).padStart(2, '0');
    const monthPrefix = `${year}-${padMonth}`;

    const items = this.loans.filter(l => l.date.startsWith(monthPrefix));
    const grandTotal = items.reduce((sum, l) => sum + l.amount, 0);

    // Agrupación por persona
    const personMap = {};
    items.forEach(l => {
      const key = l.person.toLowerCase();
      if (!personMap[key]) {
        personMap[key] = {
          person: l.person,
          totalAmount: 0,
          count: 0,
          items: []
        };
      }
      personMap[key].totalAmount += l.amount;
      personMap[key].count++;
      personMap[key].items.push(l);
    });

    // Ordenar personas de mayor a menor importe prestado
    const byPerson = Object.values(personMap).sort((a, b) => {
      if (b.totalAmount !== a.totalAmount) {
        return b.totalAmount - a.totalAmount;
      }
      return a.person.localeCompare(b.person);
    });

    return {
      year,
      month,
      monthName: this.getMonthName(month),
      monthPrefix,
      grandTotal,
      totalCount: items.length,
      items,
      byPerson
    };
  }

  /**
   * Obtiene la lista única de personas registradas hasta la fecha
   */
  getAllPeople() {
    const set = new Set();
    this.loans.forEach(l => {
      if (l.person && l.person.trim()) set.add(l.person.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  // --- UTILIDADES DE FECHA ---

  getTodayDateString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getMonthName(month) {
    const names = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return names[month - 1] || 'Mes';
  }

  // --- GENERACIÓN DE INFORMES PARA WHATSAPP ---

  /**
   * Informe del día para WhatsApp
   */
  getDailyWhatsAppText(dateStr) {
    const data = this.getDailyLoans(dateStr);
    let text = `📅 *CONTROL DE PRÉSTAMOS - ${dateStr}*\n`;
    text += `💰 *Total del día:* ${data.totalAmount.toLocaleString('es-ES')} € (${data.count} apuntes)\n\n`;

    if (data.items.length === 0) {
      text += `_No hay préstamos ni gastos registrados en esta fecha._`;
      return text;
    }

    text += `📋 *Detalle del día:*\n`;
    data.items.forEach((item, i) => {
      text += `${i + 1}. *${item.person}*: ${item.amount.toLocaleString('es-ES')} € _(${item.concept})_\n`;
    });

    return text;
  }

  /**
   * Informe del mes para WhatsApp
   */
  getMonthlyWhatsAppText(year, month) {
    const data = this.getMonthlySummary(year, month);
    let text = `📊 *CONTROL DE PRÉSTAMOS Y ADELANTOS*\n`;
    text += `🗓️ *Mes:* ${data.monthName.toUpperCase()} ${year}\n`;
    text += `💰 *GRAN TOTAL PRESTADO:* ${data.grandTotal.toLocaleString('es-ES')} € (${data.totalCount} movimientos)\n\n`;

    if (data.byPerson.length === 0) {
      text += `_No hay movimientos registrados en este mes._`;
      return text;
    }

    text += `👥 *TOTAL POR PERSONA:*\n`;
    data.byPerson.forEach((p, i) => {
      let medal = `${i + 1}. `;
      if (i === 0) medal = `🥇 `;
      else if (i === 1) medal = `🥈 `;
      else if (i === 2) medal = `🥉 `;

      text += `${medal}*${p.person}*: *${p.totalAmount.toLocaleString('es-ES')} €* (${p.count} ${p.count === 1 ? 'apunte' : 'apuntes'})\n`;
    });

    return text;
  }

  /**
   * Informe individual por persona para WhatsApp
   */
  getPersonWhatsAppText(personName, year, month) {
    const data = this.getMonthlySummary(year, month);
    const target = data.byPerson.find(p => p.person.toLowerCase() === personName.toLowerCase());

    if (!target) {
      return `No hay apuntes registrados para ${personName} en ${data.monthName} ${year}.`;
    }

    let text = `👤 *CUENTA DE PRÉSTAMOS Y GASTOS*\n`;
    text += `Nombre: *${target.person}*\n`;
    text += `Mes: ${data.monthName} ${year}\n`;
    text += `💰 *Total Acumulado:* ${target.totalAmount.toLocaleString('es-ES')} €\n\n`;
    text += `📋 *Detalle de movimientos:*\n`;

    target.items.forEach((item, i) => {
      text += `${i + 1}. ${item.date} • *${item.amount.toLocaleString('es-ES')} €* - ${item.concept}\n`;
    });

    return text;
  }
}

if (typeof window !== 'undefined') {
  window.prestamosManager = new PrestamosManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PrestamosManager, safeStorage };
}

