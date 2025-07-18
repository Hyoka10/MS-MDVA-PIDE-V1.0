/**
 * Monitoreo y auditoría de eventos del sistema.
 * Muestra logs detallados, filtros, estadísticas y modal de detalles.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Header institucional
 * - Estadísticas rápidas
 * - Filtros avanzados
 * - Tabla de logs
 * - Modal de detalles
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module AuditLogs
 */
//import { useState } from 'react';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
// //Modificacion Logs de Auditoria - Monitoreo del Sistema (Reporte PDF) (09/07/2025) ------ INICIO -----
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Shield, Search, Filter, Calendar, User, Activity,
  AlertTriangle, CheckCircle, XCircle, Eye, Clock, Trash2, FileText
} from 'lucide-react';

// //Modificacion Logs de Auditoria - Monitoreo del Sistema (Reporte PDF) (09/07/2025) ------ FIN -----
/**
/* import {
  Shield, Search, Filter, Calendar, User, Activity,
  AlertTriangle, CheckCircle, XCircle, Eye, Clock, Trash2
} from 'lucide-react';
 */
/**
 * Estructura de un log de auditoría.
 */
interface AuditLog {
  id: string;
  timestamp: string;
  usuario: string;
  accion: string;
  modulo: string;
  descripcion: string;
  ip: string;
  resultado: 'exitoso' | 'fallido' | 'advertencia';
  detalles?: string;
}

export function AuditLogs() {
  const auth = useContext(AuthContext);
  const toast = useContext(ToastContext);
  const user = auth?.user;
  const [cleaning, setCleaning] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Limpiar logs de auditoría (solo admin)
  const handleClearLogs = async () => {
    if (!user || user.rol !== 'administrador') return;
    setCleaning(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/audit-logs/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: user.email || user.dni })
      });
      if (res.ok) {
        // Recargar logs
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/audit-logs`)
          .then(res => res.ok ? res.json() : [])
          .then(data => setLogs(Array.isArray(data) ? data : []));
        toast?.addToast('Logs de auditoría limpiados correctamente.', 'success');
      } else {
        const data = await res.json();
        toast?.addToast(data.error || 'Error al limpiar logs.', 'error');
      }
    } catch (e) {
      toast?.addToast('Error de red al limpiar logs.', 'error');
    }
    setCleaning(false);
    setShowConfirmModal(false);
  };
  // Estado de logs y filtros
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('todos');
  const [resultFilter, setResultFilter] = useState('todos');
    //Modificacion Logs de Auditoria - Monitoreo del Sistema (08/07/2025) ------ INICIO -----
  const [filterOptions, setFilterOptions] = useState({ modulos: [], resultados: [] });
    //Modificacion Logs de Auditoria - Monitoreo del Sistema (08/07/2025) ------ FIN -----
  const [dateFilter, setDateFilter] = useState('hoy');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Cargar logs reales del backend
/*   useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/audit-logs`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
  }, []); */

//Modificacion Logs de Auditoria - Monitoreo del Sistema (08/07/2025) ------ INICIO -----

  // Cargar logs reales del backend y filtros dinámicos
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/audit-logs`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/audit-logs/filters`)
      .then(res => res.ok ? res.json() : { modulos: [], resultados: [] })
      .then(data => setFilterOptions({ modulos: data.modulos, resultados: data.resultados }))
      .catch(() => setFilterOptions({ modulos: [], resultados: [] }));
  }, []);

  //Modificacion Logs de Auditoria - Monitoreo del Sistema (08/07/2025) ------ FIN -----

  /**
   * Filtra los logs según búsqueda, módulo y resultado.
   */
/*   const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === 'todos' || log.modulo === moduleFilter;
    const matchesResult = resultFilter === 'todos' || log.resultado === resultFilter;
    return matchesSearch && matchesModule && matchesResult;
  }); */

  // //Modificacion Logs de Auditoria - Monitoreo del Sistema (Reporte PDF de Gestion de usuarios ) (09/07/2025) ------ INICIO -----
  // Forzar logs de exportación PDF como 'exitoso' en la visualización
  const normalizeLog = (log: AuditLog): AuditLog => {
    if (
      log.accion &&
      log.accion.toLowerCase().includes('exportar') &&
      log.descripcion &&
      log.descripcion.toLowerCase().includes('pdf')
    ) {
      return { ...log, resultado: 'exitoso' };
    }
    return log;
  };

  const filteredLogs = logs
    .map(normalizeLog)
    .filter(log => {
      console.log('🔍 filtrando log:', log.timestamp, 'con filtro:', dateFilter);
      const logDate = new Date(log.timestamp);
      const now = new Date();
      let matchesDate = true;

      if (dateFilter === 'hoy') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesDate = logDate >= today;
      } else if (dateFilter === 'semana') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = logDate >= weekAgo;
      } else if (dateFilter === 'mes') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        matchesDate = logDate >= monthAgo;
      }

      console.log('→ matchesDate?', matchesDate);
      return matchesDate &&
            (moduleFilter === 'todos' || log.modulo === moduleFilter) &&
            (resultFilter === 'todos' || log.resultado === resultFilter) &&
            (log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
              log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
              log.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    });

      // //Modificacion Logs de Auditoria - Monitoreo del Sistema (Reporte PDF de Gestion de usuarios ) (09/07/2025) ------ FIN -----

  /**
   * Devuelve el ícono correspondiente al resultado del log.
   * @param resultado - Estado del log
   */
  const getResultIcon = (resultado: string) => {
    switch (resultado) {
      case 'exitoso':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fallido':
        return <XCircle className="h-4 w-4 text-[#C01702]" />;
      case 'advertencia':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  /**
   * Devuelve el badge visual para el resultado del log.
   * @param resultado - Estado del log
   */
  const getResultBadge = (resultado: string) => {
    const colors = {
      exitoso: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      fallido: 'bg-[#F6E7E4] text-[#C01702] dark:bg-[#2A1A18] dark:text-[#C01702]',
      advertencia: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };
    const labels = {
      exitoso: 'Exitoso',
      fallido: 'Fallido',
      advertencia: 'Advertencia'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[resultado as keyof typeof colors]}`}>
        {labels[resultado as keyof typeof labels]}
      </span>
    );
  };

  /**
   * (Placeholder) Exporta los logs a archivo. Implementar si es necesario.
   */
/*   const exportLogs = () => {
    // TODO: Implementar exportación real de logs si es necesario
  }; */


// Modificacion Logs de Auditoria 11/07/2025 15:51 - Registro en audit_logs, exportacion PDF de monitoreo del sistema (Suspendido/Activo) | INICIO
  // Función utilitaria para registrar en audit_logs (puedes moverla a un helper si ya existe)
  async function registrarAuditLogMonitoreo({ usuario, accion, modulo, descripcion, detalles }: any) {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/audit-logs/frontend-warning`;
    console.log('[AUDIT-DEBUG] Enviando registro a audit_logs:', { usuario, accion, modulo, descripcion, detalles, url });
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, accion, modulo, descripcion, detalles })
      });
      console.log('[AUDIT-DEBUG] Respuesta del backend:', res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('[AUDIT-DEBUG] Error al registrar en audit_logs:', errorText);
      }
    } catch (err) {
      console.error('[AUDIT-DEBUG] Error de red al registrar en audit_logs:', err);
    }
  }

  const exportLogs = async () => {
    const doc = new jsPDF('landscape');
    const img = new window.Image();
    img.src = '/imagenes/logo_mdva_rojo.png';

// Modificacion Logs de Auditoria 11/07/2025 15:51 - Registro en audit_logs, exportacion PDF de monitoreo del sistema (Suspendido/Activo) | FIN

    type ColKey = 'fecha' | 'usuario' | 'accion' | 'modulo' | 'descripcion' | 'ip' | 'resultado';
    const cols: { header: string; dataKey: ColKey }[] = [
      { header: 'Fecha/Hora', dataKey: 'fecha' },
      { header: 'Usuario', dataKey: 'usuario' },
      { header: 'Acción', dataKey: 'accion' },
      { header: 'Módulo', dataKey: 'modulo' },
      { header: 'Descripción', dataKey: 'descripcion' },
      { header: 'IP', dataKey: 'ip' },
      { header: 'Resultado', dataKey: 'resultado' }
    ];
    type RowType = Record<ColKey, string>;
    const rows: RowType[] = filteredLogs.map(l => ({
      fecha: new Date(l.timestamp).toLocaleString('es-PE'),
      usuario: l.usuario,
      accion: l.accion,
      modulo: l.modulo,
      descripcion: l.descripcion,
      ip: l.ip,
      resultado: l.resultado.charAt(0).toUpperCase() + l.resultado.slice(1)
    }));

    img.onload = () => {
      // Logo en encabezado
      const leftMargin = 14;
      const rightMargin = 14;
      doc.addImage(img, 'PNG', leftMargin, 10, 30, 30);

      // Título con estilo corporativo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(192, 23, 2); // color institucional rojo
      doc.text('Reporte de Monitoreo del Sistema', 50, 25);
      doc.setFontSize(11);
      doc.setTextColor(100);
      const fechaHora = new Date().toLocaleString('es-PE');
      doc.text(`Fecha: ${fechaHora}`, 50, 32);
      if (user) {
        doc.text(`Generado por: ${user.nombres || ''} ${user.apellidos || ''} - ${user.email || user.dni || ''}`, 180, 32);
      }
      // Cuerpo de tabla
      autoTable(doc, {
        startY: 45,
        margin: { left: leftMargin, right: rightMargin },
        head: [cols.map(col => col.header)],
        body: rows.map(row => cols.map(col => row[col.dataKey])),
        theme: 'grid',
        headStyles: { fillColor: [192, 23, 2], halign: 'center', fontSize: 10 },
        styles: { fontSize: 10, cellPadding: 2, overflow: 'linebreak' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        // Ajuste de anchos para que la tabla no se pegue a la derecha
        columnStyles: {
          0: { cellWidth: 38 }, // Fecha/Hora
          1: { cellWidth: 32 }, // Usuario
          2: { cellWidth: 32 }, // Acción
          3: { cellWidth: 32 }, // Módulo
          4: { cellWidth: 70 }, // Descripción (más angosta)
          5: { cellWidth: 32 }, // IP
          6: { cellWidth: 32 }  // Resultado
        },
        didDrawCell: (data) => {
          // Forzar alineación vertical centrada
          data.cell.styles.valign = 'middle';
        }
      });
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(9);
        doc.setTextColor(150);

        // Texto centrado (institución)
        doc.text('Municipalidad Distrital De Vista Alegre - Sistema MDVA', pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Número de página (a la derecha, respetando margen)
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - rightMargin, pageHeight - 10, { align: 'right' });
      }
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`monitoreo_${fecha}.pdf`);
    };

// Modificacion Logs de Auditoria 11/07/2025 15:51 - Registro en audit_logs, exportacion PDF de monitoreo del sistema (Suspendido/Activo) | INICIO

    // Registrar en audit_logs (monitoreo del sistema)
    // Prioridad: contexto de usuario (AuthContext), luego localStorage, nunca 'no_proporcionado'
    let emailUsuario = '';
    if (user && user.email) {
      emailUsuario = user.email;
    } else {
      try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuarioSesion') || '{}');
        if (usuarioSesion && usuarioSesion.email) {
          emailUsuario = usuarioSesion.email;
        }
      } catch {}
    }
    if (!emailUsuario) {
      // Opción: mostrar toast de advertencia si no hay email
      toast?.addToast('No se pudo obtener el correo del usuario para el registro de auditoría.', 'warning');
      emailUsuario = 'desconocido';
    }
    const fechaHora = new Date().toISOString();
    await registrarAuditLogMonitoreo({
      usuario: emailUsuario,
      accion: 'Exportar PDF',
      modulo: 'monitoreo',
      descripcion: `Exportación de monitoreo del sistema a PDF`,
      detalles: { cantidad: filteredLogs.length, fecha: fechaHora }
    });
  };

// Modificacion Logs de Auditoria 11/07/2025 15:51 - Registro en audit_logs, exportacion PDF de monitoreo del sistema (Suspendido/Activo) | INICIO

// //Modificacion Logs de Auditoria - Monitoreo del Sistema (Reporte PDF) (09/07/2025) ------ FIN -----

  /**
   * Abre el modal de detalles para un log específico.
   * @param log - Log seleccionado
   */
  const openLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowModal(true);
  };
  
  return (
    <div className="space-y-10">
      {/* Header institucional */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
            Monitoreo <span className="text-[#C01702] font-bold">del Sistema</span>
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-300">
            Registro detallado de actividades y eventos del sistema
          </p>
          <div className="h-1 w-16 bg-[#C01702] rounded mt-3" />
        </div>
     <div className="flex items-center gap-3">
          <button
            onClick={exportLogs}
            title="Exportar registros a PDF"
            className="flex items-center gap-2 px-5 py-2 bg-white border border-[#C01702] text-[#C01702] hover:bg-[#C01702] hover:text-white rounded-lg font-semibold shadow transition focus:outline-none"
            aria-label="Exportar logs a PDF"
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium text-base">Exportar PDF</span>
          </button>
          {user?.rol === 'administrador' && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={cleaning}
              title="Eliminar todos los logs de auditoría"
              className="flex items-center gap-2 px-5 py-2 bg-[#C01702] hover:bg-[#a31200] text-white rounded-lg font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              aria-label="Eliminar logs de auditoría"
            >
              <Trash2 className="h-5 w-5" />
              <span className="font-medium text-base">Eliminar registros</span>
            </button>
          )}
        </div>
        </div>
      
      {/* Modal de confirmación para limpiar logs */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full shadow-2xl p-0 relative">
            <div className="flex flex-col items-center px-8 py-8">
              <Trash2 className="h-12 w-12 text-[#C01702] mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">¿Eliminar todos los registros?</h3>
              <p className="text-base text-gray-600 dark:text-gray-300 mb-6 text-center">Esta acción no se puede deshacer. ¿Desea continuar?</p>
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition focus:outline-none"
                  disabled={cleaning}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-5 py-2 rounded-lg bg-[#C01702] text-white font-semibold hover:bg-[#a31200] transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={cleaning}
                  autoFocus
                >
                  <Trash2 className="h-5 w-5" />
                  {cleaning ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
{/*Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ FIN-----*/}
      
{/* Estadísticas rápidas */}
{/*Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ INICIO-----*/}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
{/*Modificacion Logs de Auditoria - Monitoreo del Sistema (04/07/2025) ------ FIN-----*/}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-[#C01702]" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Eventos</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{logs.filter(l => l.resultado === 'exitoso').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Exitosos</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-8 w-8 text-[#C01702]" />
            <span className="text-2xl font-bold text-[#C01702]">{logs.filter(l => l.resultado === 'fallido').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Fallidos</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold text-yellow-600">{logs.filter(l => l.resultado === 'advertencia').length}</span>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Advertencias</span>
        </div>
      </div>

   {/* Modificacion Logs de Auditoria - Monitoreo del Sistema (08/07/2025) ------ INICIO ----- */}
       {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-2 focus:border-black active:border-black text-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-2 focus:border-black active:border-black text-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
              >
                <option value="todos">Todos los módulos</option>
                {filterOptions.modulos.map((modulo: string) => (
                  <option key={modulo} value={modulo}>{modulo}</option>
                ))}
              </select>
            </div>
            {/* Filtros de acción y usuario eliminados */}
            <div className="flex items-center gap-2">
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-2 focus:border-black active:border-black text-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
              >
                <option value="todos">Todos los resultados</option>
                {filterOptions.resultados.map((resultado: string) => (
                  <option key={resultado} value={resultado}>{resultado.charAt(0).toUpperCase() + resultado.slice(1)}</option>
                ))}
              </select>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-2 focus:border-black active:border-black text-lg bg-white dark:bg-gray-800 dark:text-white shadow-sm"
            >
              <option value="hoy">Hoy</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="todos">Todos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modificacion Logs de Auditoria - Monitoreo del Sistema (08/07/2025) ------ FIN ----- */}

      {/* Tabla de logs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#C01702]/60 scrollbar-track-gray-200 dark:scrollbar-track-gray-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Resultado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {/* // //Modificacion Logs de Auditoria - Monitoreo del Sistema (Reporte PDF de Gestion de usuarios ) (09/07/2025) ------ INICIO ----- */}
      {filteredLogs.map((log) => {
        // Normalizar también para el modal de detalles
        const normalizedLog = normalizeLog(log);
        return (
          <tr key={normalizedLog.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-900 dark:text-white">
                    {new Date(normalizedLog.timestamp).toLocaleDateString('es-PE')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(normalizedLog.timestamp).toLocaleTimeString('es-PE')}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900 dark:text-white">{normalizedLog.usuario}</span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{normalizedLog.accion}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                  {normalizedLog.descripcion}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {normalizedLog.modulo}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                {getResultIcon(normalizedLog.resultado)}
                {getResultBadge(normalizedLog.resultado)}
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {normalizedLog.ip}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                onClick={() => openLogDetail(normalizedLog)}
                className="text-[#C01702] hover:text-[#a31200] focus:outline-none focus:ring-2 focus:ring-[#C01702] rounded transition"
                title="Ver detalles"
                aria-label={`Ver detalles del log ${normalizedLog.id}`}
              >
                <Eye className="h-4 w-4" />
              </button>
            </td>
          </tr>
        );
      })}
{/* // //Modificacion Logs de Auditoria - Monitoreo del Sistema (Reporte PDF de Gestion de usuarios ) (09/07/2025) ------ FIN ----- */}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fade-in">

          {/* Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | INICIO */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full shadow-2xl p-0 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-[#C01702] focus:outline-none"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="px-8 py-8">
              <div className="flex flex-col items-center mb-6">
                {getResultIcon(selectedLog.resultado)}
                <span className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Detalle del Evento</span>
                <span className="text-xs text-gray-400 mt-1">ID: {selectedLog.id}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Fecha/Hora:</span>
                  <span className="text-right">{new Date(selectedLog.timestamp).toLocaleString('es-PE')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Usuario:</span>
                  <span className="text-right">{selectedLog.usuario}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Acción:</span>
                  <span className="text-right">{selectedLog.accion}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Módulo:</span>
                  <span className="text-right">{selectedLog.modulo}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">Resultado:</span>
                  <span className="text-right">{getResultBadge(selectedLog.resultado)}</span>
{/* Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | FIN */}                
                </div>
{/* Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | INICIO */}                
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200">IP:</span>
                  <span className="text-right">{selectedLog.ip}</span>
                </div>
                <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-700 dark:text-gray-200 mb-1">Descripción:</span>
                  <span className="text-left whitespace-pre-line text-gray-600 dark:text-gray-300">{selectedLog.descripcion}</span>
                </div>
                {selectedLog.detalles && (() => {
                  let parsed = null;
                  try {
                    parsed = typeof selectedLog.detalles === 'string' ? JSON.parse(selectedLog.detalles) : selectedLog.detalles;
                  } catch {
                    parsed = selectedLog.detalles;
                  }
                  // Traducción de claves técnicas a descripciones legibles
                  const keyLabels: Record<string, string> = {
                    estado_id: 'Estado',
                    nuevo_estado: 'Nuevo estado',
                    anterior_estado: 'Estado anterior',
                    user_id: 'Usuario',
                    usuario: 'Usuario',
                    rol_id: 'Rol',
                    rol: 'Rol',
                    cargo_id: 'Cargo',
                    cargo: 'Cargo',
                    cantidad: 'Cantidad',
                    fecha: 'Fecha',
                    // Agrega más traducciones según tus campos
                  };
                  // Mapas de ids a nombres legibles (pueden venir del backend o ser estáticos)
                  const rolesMap: Record<string, string> = {
                    '1': 'Administrador',
                    '2': 'Trabajador',
                    '3': 'Invitado',
                  };
                  const cargosMap: Record<string, string> = {
                    '1': 'Jefe de Área',
                    '2': 'Analista',
                    '3': 'Soporte',
                  };
                  // Traducción de valores de estado comunes
                  const estadoMap: Record<string, string> = {
                    '1': 'Activo',
                    '2': 'Suspendido',
                    '3': 'Eliminado',
                    activo: 'Activo',
                    suspendido: 'Suspendido',
                    eliminado: 'Eliminado',
                  };
                  function renderValue(key: string, value: any, showOld = false) {
                    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('contraseña')) {
                      // No mostrar valores de contraseña, solo indicar que fue modificada
                      return null;
                    }
                    if (key.toLowerCase().includes('estado') && (estadoMap[String(value).toLowerCase()] || estadoMap[String(value)])) {
                      return estadoMap[String(value).toLowerCase()] || estadoMap[String(value)];
                    }
                    if (key.toLowerCase().includes('rol') && (rolesMap[String(value)])) {
                      return rolesMap[String(value)];
                    }
                    if (key.toLowerCase().includes('cargo') && (cargosMap[String(value)])) {
                      return cargosMap[String(value)];
                    }
                    if (typeof value === 'object') return JSON.stringify(value);
                    return String(value);
{/* Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | FIN */}                    
                  }
                  if (
                    parsed &&
                    parsed.antes &&
                    Array.isArray(parsed.campos_modificados)
                  ) {
{/* Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | INICIO */}                    
                    // Si hay cambio de contraseña, mostrar solo mensaje genérico
                    const contienePassword = parsed.campos_modificados.some((campo: string) => campo.toLowerCase().includes('password') || campo.toLowerCase().includes('contraseña'));
                    if (contienePassword) {
                      return (
                        <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-700 dark:text-gray-200 mb-1">Campos modificados:</span>
                          <ul className="space-y-1 mt-1">
                            <li className="flex items-center gap-2">
                              <span className="capitalize font-semibold">Contraseña:</span>
                              <span className="text-blue-700 font-semibold">[La contraseña fue modificada]</span>
                            </li>
                            {/* Mostrar otros campos modificados normalmente */}
                            {parsed.campos_modificados.filter((campo: string) => !(campo.toLowerCase().includes('password') || campo.toLowerCase().includes('contraseña'))).map((campo: string) => (
                              <li key={campo} className="flex items-center gap-2">
                                <span className="capitalize font-semibold">{keyLabels[campo] || campo.replace('_', ' ')}:</span>
                                <span className="line-through text-red-600">{renderValue(campo, parsed.antes[campo], true)}</span>
                                <span className="text-green-700 font-semibold">{renderValue(campo, parsed.despues[campo], false)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    // Si no hay cambio de contraseña, mostrar normalmente
                    return (
                      <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-200 mb-1">Campos modificados:</span>
                        <ul className="space-y-1 mt-1">
                          {parsed.campos_modificados.map((campo: string) => (
                            <li key={campo} className="flex items-center gap-2">
                              <span className="capitalize font-semibold">{keyLabels[campo] || campo.replace('_', ' ')}:</span>
                              <span className="line-through text-red-600">{renderValue(campo, parsed.antes[campo], true)}</span>
                              <span className="text-green-700 font-semibold">{renderValue(campo, parsed.despues[campo], false)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  // Si no es un cambio de usuario, mostrar detalles adicionales de forma más legible
                  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
                    return (
                      <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-200 mb-1">Detalles adicionales:</span>
                        <table className="w-full text-left border-separate border-spacing-y-1">
                          <tbody>
                            {Object.entries(parsed).map(([key, value]) => (
                              <tr key={key}>
                                <td className="pr-2 font-semibold text-gray-700 dark:text-gray-200 capitalize">{keyLabels[key] || key.replace('_', ' ')}:</td>
                                <td className="text-gray-600 dark:text-gray-300 break-all">{renderValue(key, value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     
                      </div>
                    );
                  }
                  
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    return (
                      <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-200 mb-1">Detalles adicionales:</span>
                        <ul className="list-disc ml-5 mt-1">
                          {parsed.map((item: any, idx: number) => (
                            <li key={idx} className="text-gray-600 dark:text-gray-300">{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
{/* Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | FIN */}    

{/* Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | INICIO */}                  
                  if (parsed && typeof parsed === 'string' && parsed.trim().length > 0) {
                    return (
                      <div className="flex flex-col text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-200 mb-1">Detalles adicionales:</span>
                        <span className="text-left whitespace-pre-line text-gray-600 dark:text-gray-300">{parsed}</span>
                      </div>
                    );
                  }
                  // Si no hay detalles relevantes
                  return null;
                })()}
{/* Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | FIN */}  
              </div>
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-7 py-3 bg-[#C01702] hover:bg-[#a31200] text-white rounded-xl font-bold shadow-lg text-lg transition focus:outline-none focus:ring-2 focus:ring-[#C01702] flex items-center gap-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}