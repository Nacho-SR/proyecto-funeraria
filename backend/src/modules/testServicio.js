import { registrarServicio } from "./altaServicio.js"; 

async function testAltaServicio() {
    console.log("Iniciando prueba de Alta de Paquete...");

    try {
        const servicioPrueba = {
            nombre: "Fx",
            descripcion: "ataud",
            precioBase: 5000.00,
            paqueteID: "01"
        };

        const resultado = await registrarServicio(servicioPrueba);

        if (resultado.success) {
            console.log("API Funcionando: Paquete registrado con éxito.");
            console.log("ID del nuevo paquete:", resultado.id);
        } else {
            console.error("Fallo en la API:", resultado.error);
        }
    } catch (err) {
        console.error("Error inesperado durante el test:", err);
    }

    process.exit(0);
}

testAltaServicio().then(() => {
    console.log("Proceso terminado.");
}).catch(err => {
    console.error("Error en la ejecución:", err);
});