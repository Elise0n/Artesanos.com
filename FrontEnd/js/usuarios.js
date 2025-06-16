// Enviar datos del formulario de registro
document.querySelector('#formRegistro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const nombre = document.querySelector('#nombre').value;
    const email = document.querySelector('#email').value;
    const contraseña = document.querySelector('#contraseña').value;
  
    try {
      const res = await fetch('/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, contraseña }),
      });
  
      const data = await res.text();
      alert(data); // mostrar mensaje de éxito o error
    } catch (err) {
      alert('Error al registrar usuario');
    }
  });
  