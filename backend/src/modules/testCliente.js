import { registrarCliente } from "./cliente.js"; 

async function testAlta() {
    console.log("Iniciando prueba de Alta de Cliente...");

    try {
        const clientePrueba = {
            nombre: "Andrea",
            apaterno: "Varela",
            amaterno: "Medina",
            telefono: "4645932409",
            email: "a.varelamedina@ugto.mx",
            calle: "x",
            colonia: "y",
            numCasa: "22",
            usuarioID: "a01" 
        };

        const resultado = await registrarCliente(clientePrueba);

        if (resultado.success) {
            console.log("API Funcionando: Cliente registrado con éxito.");
            console.log("ID del nuevo cliente:", resultado.id);
        } else {
            console.error("Fallo en la API:", resultado.error);
        }
    } catch (err) {
        console.error("Error inesperado durante el test:", err);
    }

    process.exit(0);
}

testAlta().then(() => {
    console.log("Proceso terminado.");
}).catch(err => {
    console.error("Error en la ejecución:", err);
});