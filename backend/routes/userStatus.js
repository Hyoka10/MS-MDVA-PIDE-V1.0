import express from 'express';
import { sendEmail } from '../utils/mailer.js';

const router = express.Router();

const userStatusRoutes = (pool) => {
  router.put('/users/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado, solicitante } = req.body;

    if (!estado || !['suspendido', 'activo'].includes(estado.toLowerCase())) {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    
    if (!solicitante) {
      return res.status(400).json({ error: 'Falta identificador del solicitante' });
    }

    if (Number(id) === Number(solicitante)) {
      return res.status(403).json({ error: 'No puedes autoeditar tu estado' });
    }

    // Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | INICIO
    try {
      // Obtener usuario antes del cambio
      const prevResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (prevResult.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      const prev = prevResult.rows[0];

      // Determinar nuevo estado_id
      const estado_id = estado.toLowerCase() === 'suspendido' ? 2 : 1;

      // Actualizar estado
      const updateResult = await pool.query(
        'UPDATE users SET estado_id = $1 WHERE id = $2 RETURNING *',
        [estado_id, id]
      );
      const updatedUser = updateResult.rows[0];
      if (!updatedUser || !updatedUser.email) {
        return res.status(500).json({ error: 'No se pudo obtener el usuario actualizado' });
      }

      // Registrar en audit_logs con depuración
      let ip = req.headers['x-forwarded-for']?.toString().split(',').shift() || req.socket?.remoteAddress || req.ip || '';
      if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
      let accion = '';
      let descripcion = '';
      if (estado_id === 2) {
        accion = 'Usuario Suspendido';
        descripcion = `Usuario suspendido temporalmente`;
      } else if (estado_id === 1) {
        accion = 'Usuario Activado';
        descripcion = `Usuario activado recientemente`;
      }
      const auditLogParams = [
        prev.email || prev.dni || '',
        accion,
        'usuarios',
        descripcion,
        ip,
        'exitoso',
        JSON.stringify({ antes: prev.estado_id, despues: updatedUser.estado_id })
      ];
      console.log('[AUDIT-DEBUG] Intentando registrar en audit_logs:', {
        usuario: auditLogParams[0],
        accion: auditLogParams[1],
        modulo: auditLogParams[2],
        descripcion: auditLogParams[3],
        ip: auditLogParams[4],
        resultado: auditLogParams[5],
        detalles: auditLogParams[6]
      });
      try {
        const auditResult = await pool.query(
          `INSERT INTO audit_logs (usuario, accion, modulo, descripcion, ip, resultado, detalles)
           VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
          auditLogParams
        );
        console.log('[AUDIT-DEBUG] Registro en audit_logs exitoso:', auditResult.rowCount);
      } catch (auditErr) {
        console.error('[AUDIT-DEBUG] Error al registrar en audit_logs:', auditErr);
      }

      // Modificacion Logs de Auditoria 11/07/2025 15:24 - Registro en audit_logs, estados de los usuarios (Suspendido/Activo) | FIN
      // Enviar correo
      const asunto = estado_id === 2 ? 'Cuenta suspendida' : 'Cuenta reactivada';
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border:1px solid #ddd; border-radius: 8px;">
          <div style="background-color:rgb(255, 202, 195); padding: 20px; text-align: center;">
            <img src="https://i.pinimg.com/736x/8b/7d/ff/8b7dff72f53c290933f1e652b326d8d2.jpg" alt="MDVA Logo" style="height: 50px;" />
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #C01702;">Cuenta ${estado.toLowerCase()}</h2>
            <p>Hola <strong>${updatedUser.nombres}</strong>,</p>
            <p>Tu cuenta ha sido <strong>${estado_id === 2 ? 'suspendida' : 'reactivada'}</strong> en el sistema MDVA.</p>
            <p>Si no lo solicitaste o tienes dudas, contacta con la Oficina de Transformación Digital.</p>
            <hr style="border:none;border-top:1px solid #eee;" />
            <p style="font-size: 12px; color: #666;">Este mensaje es automático, por favor no lo respondas.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
            Municipalidad Distrital de Vista Alegre — MDVA Sistema de Usuarios
          </div>
        </div>
      `;

      await sendEmail({
        to: updatedUser.email,
        subject: asunto,
        html
      });

      console.log(`📧 Correo de estado (${estado.toLowerCase()}) enviado a`, updatedUser.email);
      res.json({ success: true, user: updatedUser });

    } catch (err) {
      console.error('❌ Error al actualizar estado o enviar correo:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  return router;
};

export default userStatusRoutes;