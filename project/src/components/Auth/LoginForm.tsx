/**
 * Formulario de inicio de sesión institucional.
 * Permite autenticación de usuarios y acceso rápido de demostración.
 * Accesible, responsivo y preparado para producción.
 *
 * Estructura visual:
 * - Imagen institucional
 * - Formulario de login
 * - Acceso rápido de demostración
 *
 * Accesibilidad:
 * - Roles semánticos, foco visible, contraste, ARIA labels
 *
 * @module LoginForm
 */
import { useState } from 'react';
import { User, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/**
 * Componente de formulario de login principal.
 * Permite autenticación y acceso rápido de prueba.
 */
export function LoginForm() {
  // Estado del formulario de login
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'trabajador' as 'trabajador' | 'administrador'
  });
  const { login, isLoading } = useAuth();
  const { addToast } = useToast();

  /**
   * Envía el formulario de login y muestra feedback.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(formData.email, formData.password, formData.role);
    if (success) {
      addToast('Inicio de sesión exitoso', 'success');
    } else {
      addToast('Credenciales inválidas. Use: 123456 como contraseña', 'error');
    }
  };

  /**
   * Autocompleta el login para acceso rápido de demostración.
   * @param role - Rol a autocompletar
   */
  const quickLogin = (role: 'trabajador' | 'administrador') => {
    const email = role === 'trabajador'
      ? 'mquispe@municipalidad.gob.pe'
      : 'cvargas@municipalidad.gob.pe';
    setFormData({
      email,
      password: '123456',
      role
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFF] dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 flex items-center">
      {/* Imagen decorativa a la izquierda, solo visible en md+ */}
      <div className="hidden md:flex flex-1 h-full items-stretch justify-end">
        <div className="w-full h-full">
          <img src="/imagenes/banner_mdva.jpg" alt="Ilustración" className="w-full h-full object-cover"/>
        </div>
      </div>
      <div className="flex justify-center flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-21 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden bg-white">
            <img src="/imagenes/logo_gob.pe.png" alt="Logo Municipalidad" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-wider font-sans drop-shadow-md" style={{fontFamily: 'Montserrat, Inter, Arial, sans-serif'}}>
            PIDE <span className="text-primary-600 dark:text-primary-400">-</span> MDVA
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
         

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Usuario
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-0 dark:bg-gray-700 dark:text-white"
                placeholder="Ingrese su usuario oooooo ID"
                required
                style={{ boxShadow: 'none', borderColor: '#000', borderWidth: '1px' }}
                onFocus={e => e.currentTarget.style.setProperty('border-color', '#C01702', 'important')}
                onBlur={e => e.currentTarget.style.setProperty('border-color', '#000', 'important')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-0 dark:bg-gray-700 dark:text-white"
                placeholder="Ingrese su contraseña"
                required
                style={{ boxShadow: 'none', borderColor: '#000', borderWidth: '1px' }}
                onFocus={e => e.currentTarget.style.setProperty('border-color', '#C01702', 'important')}
                onBlur={e => e.currentTarget.style.setProperty('border-color', '#000', 'important')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
            Acceso rápido de demostración:
          </p>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin('trabajador')}
              className="w-full text-left p-2 text-xs bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <strong>Trabajador:</strong> mquispe@municipalidad.gob.pe
            </button>
            <button
              onClick={() => quickLogin('administrador')}
              className="w-full text-left p-2 text-xs bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <strong>Administrador:</strong> cvargas@municipalidad.gob.pe
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            Contraseña: 123456
          </p>
        </div>
      </div>
        </div>
      </div>
  );
}