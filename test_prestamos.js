// Test suite automatizado para Control de Préstamos y Adelantos
const assert = require('assert');
const { PrestamosManager, safeStorage } = require('./js/prestamos.js');

console.log('🧪 Iniciando pruebas automáticas de Control de Préstamos...\n');

// 1. Instanciar manager limpio
safeStorage._mem = {}; // limpiar memoria
const pm = new PrestamosManager();

// 2. Prueba de agregar préstamos en varias fechas
console.log('Test 1: Agregar préstamos...');
const l1 = pm.addLoan('2026-10-04', 'Carlos Ruiz', 'Gasolina furgoneta', 45.50);
const l2 = pm.addLoan('2026-10-04', 'Ana Gómez', 'Adelanto nómina', 120.00);
const l3 = pm.addLoan('2026-10-04', 'Carlos Ruiz', 'Comida en ruta', 15.00);
const l4 = pm.addLoan('2026-10-03', 'Carlos Ruiz', 'Adelanto', 50.00);
const l5 = pm.addLoan('2026-09-15', 'Pedro Soto', 'Material ferretería', 80.00);

assert.strictEqual(pm.loans.length, 5, 'Debe haber 5 préstamos registrados');
console.log('✅ 5 préstamos creados correctamente.');

console.log('Test 1.1: Agregar múltiples conceptos a la vez...');
const multi = pm.addMultipleLoans('2026-11-05', 'Mario Conde', [
  { concept: 'Gasolina', amount: 30 },
  { concept: 'Dietas', amount: 20 },
  { concept: 'Peaje', amount: 12.5 }
]);
assert.strictEqual(multi.length, 3, 'Debe haber agregado 3 conceptos');
const d5 = pm.getDailyLoans('2026-11-05');
assert.strictEqual(d5.totalAmount, 62.5, 'Total de los 3 conceptos debe ser 62.5');
console.log('✅ Múltiples conceptos agregados correctamente en un solo guardado.');


// 3. Prueba de Sumatorio Diario (2026-10-04)
console.log('Test 2: Sumatorio Diario...');
const daily = pm.getDailyLoans('2026-10-04');
assert.strictEqual(daily.items.length, 3, 'El 2026-10-04 debe tener 3 apuntes');
// 45.50 + 120.00 + 15.00 = 180.50
assert.strictEqual(daily.totalAmount, 180.50, 'El total del día debe ser 180.50');
console.log(`✅ Sumatorio Diario exacto: ${daily.totalAmount} € con ${daily.count} apuntes.`);

// 4. Prueba de Sumatorio Mensual (Octubre 2026)
console.log('Test 3: Sumatorio Mensual...');
const monthly = pm.getMonthlySummary(2026, 10);
// Octubre tiene l1 (45.50), l2 (120.00), l3 (15.00), l4 (50.00) = 230.50
assert.strictEqual(monthly.totalCount, 4, 'Octubre 2026 debe tener 4 préstamos');
assert.strictEqual(monthly.grandTotal, 230.50, 'El total mensual debe ser 230.50');
console.log(`✅ Sumatorio Mensual exacto: ${monthly.grandTotal} € con ${monthly.totalCount} movimientos.`);

// 5. Agrupación por persona en Octubre
console.log('Test 4: Agrupación y ranking por personas...');
// Carlos Ruiz: 45.50 + 15.00 + 50.00 = 110.50 (3 apuntes)
// Ana Gómez: 120.00 (1 apunte)
// El primero debe ser Ana Gómez (120.00), el segundo Carlos Ruiz (110.50)
assert.strictEqual(monthly.byPerson.length, 2, 'En octubre hay 2 personas distintas');
assert.strictEqual(monthly.byPerson[0].person, 'Ana Gómez');
assert.strictEqual(monthly.byPerson[0].totalAmount, 120.00);
assert.strictEqual(monthly.byPerson[1].person, 'Carlos Ruiz');
assert.strictEqual(monthly.byPerson[1].totalAmount, 110.50);
console.log('✅ Ranking mensual por persona ordenado y verificado correctamente.');

// 6. Prueba de edición
console.log('Test 5: Editar préstamo...');
pm.editLoan(l3.id, { amount: 20.00, concept: 'Comida menú completo' });
const updatedDaily = pm.getDailyLoans('2026-10-04');
// 45.50 + 120.00 + 20.00 = 185.50
assert.strictEqual(updatedDaily.totalAmount, 185.50, 'Total tras edición debe ser 185.50');
console.log('✅ Edición de préstamo y recálculo verificado con éxito.');

// 7. Prueba de eliminación
console.log('Test 6: Eliminar préstamo...');
pm.deleteLoan(l4.id); // borrar los 50.00 del 2026-10-03
const octAfterDelete = pm.getMonthlySummary(2026, 10);
// 185.50
assert.strictEqual(octAfterDelete.grandTotal, 185.50, 'Total mensual tras eliminación debe ser 185.50');
console.log('✅ Eliminación de préstamo y recálculo verificado con éxito.');

// 8. Prueba de formato WhatsApp
console.log('Test 7: Informes WhatsApp...');
const dailyWa = pm.getDailyWhatsAppText('2026-10-04');
assert(dailyWa.includes('185,5 €'), 'El texto de WhatsApp diario debe incluir el total');
const monthlyWa = pm.getMonthlyWhatsAppText(2026, 10);
assert(monthlyWa.includes('OCTUBRE 2026'), 'El texto de WhatsApp mensual debe contener el mes');
const personWa = pm.getPersonWhatsAppText('Carlos Ruiz', 2026, 10);
assert(personWa.includes('Carlos Ruiz'), 'El texto de WhatsApp persona debe contener su nombre');
console.log('✅ Formatos de WhatsApp generados con éxito.');


console.log('\n✨ ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE! (100% OK)');
