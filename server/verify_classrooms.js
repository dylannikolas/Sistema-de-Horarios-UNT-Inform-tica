"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var db_1 = __importDefault(require("./db"));
function verifyClassrooms() {
    return __awaiter(this, void 0, void 0, function () {
        var totalResult, byType, labs, theory, stats, s, distribution, assignments, aulaUsage, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 12, , 14]);
                    console.log('🔍 VERIFICANDO AULAS Y LABORATORIOS EN LA BASE DE DATOS\n');
                    console.log('='.repeat(70));
                    return [4 /*yield*/, db_1.default.query('SELECT COUNT(*) as total FROM classrooms')];
                case 1:
                    totalResult = (_a.sent())[0];
                    console.log("\n\uD83D\uDCCA Total de aulas: ".concat(totalResult[0].total));
                    // 2. Aulas por tipo
                    console.log('\n📋 AULAS POR TIPO:');
                    console.log('-'.repeat(70));
                    return [4 /*yield*/, db_1.default.query("\n      SELECT \n        type, \n        COUNT(*) as count,\n        SUM(capacity) as total_capacity,\n        AVG(capacity) as avg_capacity\n      FROM classrooms \n      GROUP BY type \n      ORDER BY type\n    ")];
                case 2:
                    byType = (_a.sent())[0];
                    byType.forEach(function (row) {
                        console.log("   ".concat(row.type.padEnd(15), ": ").concat(row.count, " aulas"));
                        console.log("      Capacidad total: ".concat(row.total_capacity, " estudiantes"));
                        console.log("      Capacidad promedio: ".concat(parseFloat(row.avg_capacity).toFixed(2), " estudiantes"));
                    });
                    // 3. Listado de laboratorios
                    console.log('\n\n🔬 LABORATORIOS:');
                    console.log('-'.repeat(70));
                    return [4 /*yield*/, db_1.default.query("\n      SELECT id, name, capacity \n      FROM classrooms \n      WHERE type = 'Laboratorio'\n      ORDER BY name\n    ")];
                case 3:
                    labs = (_a.sent())[0];
                    labs.forEach(function (lab, index) {
                        console.log("   ".concat(index + 1, ". ").concat(lab.name));
                        console.log("      Capacidad: ".concat(lab.capacity, " estudiantes | ID: ").concat(lab.id));
                    });
                    // 4. Listado de aulas teóricas
                    console.log('\n\n📚 AULAS TEÓRICAS:');
                    console.log('-'.repeat(70));
                    return [4 /*yield*/, db_1.default.query("\n      SELECT id, name, capacity \n      FROM classrooms \n      WHERE type = 'Teor\u00EDa'\n      ORDER BY name\n    ")];
                case 4:
                    theory = (_a.sent())[0];
                    theory.forEach(function (aula, index) {
                        console.log("   ".concat(index + 1, ". ").concat(aula.name));
                        console.log("      Capacidad: ".concat(aula.capacity, " estudiantes | ID: ").concat(aula.id));
                    });
                    // 5. Estadísticas de capacidad
                    console.log('\n\n📈 ESTADÍSTICAS DE CAPACIDAD:');
                    console.log('-'.repeat(70));
                    return [4 /*yield*/, db_1.default.query("\n      SELECT \n        MIN(capacity) as min_capacity,\n        MAX(capacity) as max_capacity,\n        AVG(capacity) as avg_capacity,\n        SUM(capacity) as total_capacity\n      FROM classrooms\n    ")];
                case 5:
                    stats = (_a.sent())[0];
                    s = stats[0];
                    console.log("   Capacidad m\u00EDnima: ".concat(s.min_capacity, " estudiantes"));
                    console.log("   Capacidad m\u00E1xima: ".concat(s.max_capacity, " estudiantes"));
                    console.log("   Capacidad promedio: ".concat(parseFloat(s.avg_capacity).toFixed(2), " estudiantes"));
                    console.log("   Capacidad total: ".concat(s.total_capacity, " estudiantes"));
                    // 6. Distribución de capacidad
                    console.log('\n\n📊 DISTRIBUCIÓN DE CAPACIDAD:');
                    console.log('-'.repeat(70));
                    return [4 /*yield*/, db_1.default.query("\n      SELECT \n        CASE \n          WHEN capacity < 30 THEN 'Peque\u00F1a (< 30)'\n          WHEN capacity >= 30 AND capacity < 40 THEN 'Mediana (30-39)'\n          ELSE 'Grande (>= 40)'\n        END as size_category,\n        COUNT(*) as count,\n        SUM(capacity) as total_capacity\n      FROM classrooms\n      GROUP BY size_category\n      ORDER BY \n        CASE size_category\n          WHEN 'Peque\u00F1a (< 30)' THEN 1\n          WHEN 'Mediana (30-39)' THEN 2\n          ELSE 3\n        END\n    ")];
                case 6:
                    distribution = (_a.sent())[0];
                    distribution.forEach(function (row) {
                        console.log("   ".concat(row.size_category.padEnd(20), ": ").concat(row.count, " aulas (").concat(row.total_capacity, " estudiantes)"));
                    });
                    return [4 /*yield*/, db_1.default.query("\n      SELECT COUNT(*) as count FROM assignments\n    ")];
                case 7:
                    assignments = (_a.sent())[0];
                    if (!(assignments[0].count > 0)) return [3 /*break*/, 9];
                    console.log('\n\n📅 ASIGNACIONES DE AULAS:');
                    console.log('-'.repeat(70));
                    return [4 /*yield*/, db_1.default.query("\n        SELECT \n          c.name,\n          c.type,\n          COUNT(a.id) as assignments_count\n        FROM classrooms c\n        LEFT JOIN assignments a ON c.id = a.classroom_id\n        GROUP BY c.id\n        ORDER BY assignments_count DESC, c.name\n      ")];
                case 8:
                    aulaUsage = (_a.sent())[0];
                    aulaUsage.forEach(function (row) {
                        var usage = row.assignments_count > 0 ? "".concat(row.assignments_count, " asignaciones") : 'Sin asignaciones';
                        console.log("   ".concat(row.name.padEnd(35), ": ").concat(usage));
                    });
                    return [3 /*break*/, 10];
                case 9:
                    console.log('\n\n📅 No hay asignaciones de aulas aún');
                    _a.label = 10;
                case 10:
                    console.log('\n' + '='.repeat(70));
                    console.log('✅ Verificación completada exitosamente!\n');
                    return [4 /*yield*/, db_1.default.end()];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 14];
                case 12:
                    error_1 = _a.sent();
                    console.error('❌ Error:', error_1);
                    return [4 /*yield*/, db_1.default.end()];
                case 13:
                    _a.sent();
                    process.exit(1);
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
verifyClassrooms();
