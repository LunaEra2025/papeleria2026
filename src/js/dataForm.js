import Buttons from "./buttons.js";
import apiEndPoints from "./endPoints.js";
import conection from "./validConnection.js";


document.addEventListener('DOMContentLoaded', function () {
    // Verifica si el usuario está autenticado
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = "login.html"; // Redirige al login si no está autenticado
        return; // evita que el resto del código se ejecute
    }

    // ── Dashboard: total de productos ────────────────────────────────────────
    actualizarDashboard();

    // ── Poblar select de marcas desde la BD ───────────────────────────────────
    apiEndPoints.selectAllMarcas().then(function (marcas) {
        const select = document.getElementById('cboMarca');
        if (!select) return;

        // Limpiar y colocar el placeholder
        select.innerHTML = '<option selected disabled value="">Elige una marca...</option>';

        if (!Array.isArray(marcas)) {
            select.innerHTML = '<option disabled value="">Error al cargar marcas</option>';
            return;
        }

        marcas.forEach(function (marca) {
            const option = document.createElement('option');
            option.value = marca.IDmarca;           // valor que se envía a la BD (M001, M002…)
            option.textContent = marca.nombreMarca; // texto visible (Bic, Staedtler…)
            select.appendChild(option);
        });
    });


    // Ocultar la tabla al cargar la página
    ocultarTablaProductos(); // Llama a la función para ocultar la tabla

    // Capturar el evento de cambio en el rango y actualizar el valor del <output> y la etiqueta
    document.getElementById('rngCantidad').addEventListener('input', function () {
        this.nextElementSibling.value = this.value;
        const lbl = document.getElementById('rngValor');
        if (lbl) lbl.textContent = this.value;
    });

    let datosCeldas = []; // Array para almacenar los datos de las celdas


    // EVENTOS EN LOS BOTONES    , la función debe ser asincrona

    document.getElementById('tbodyProductos').addEventListener('click', async function (event) {
        // event contiene información sobre el evento que ocurrió
        // event.target.id accede al elemento (etiqueta) específico dentro de #tbodyProductos que fue clickeado.
        // id es la propiedad del boton

        // ACCIONES DE LOS BOTONES

        if (event.target.id === 'btnEditar') {

            const rowEdit = event.target.closest('tr');
            const cells = rowEdit.querySelectorAll('td'); // Selecciona todas las celdas de la fila

            datosCeldas = []; // Reinicia el array de datos de celdas
            cells.forEach((cell, index) => {

                if (index < cells.length - 1 && index !== 0) { // Evita la última celda (acciones) y evita la celda del ID
                    const valorActual = cell.textContent; // Obtiene el valor actual de la celda
                    datosCeldas.push(valorActual); // Agrega el valor actual al array

                    const input = document.createElement('input'); // Crea un campo de entrada
                    input.type = 'text';
                    input.value = valorActual; // Establece el valor actual como predeterminado
                    input.className = 'form-control'; // Clase opcional para estilos
                    cell.textContent = ''; // Limpia el contenido de la celda anterior para colocar el input
                    cell.appendChild(input); // Agrega el campo de entrada a la celda
                }
            });

            // aqui funciona con tarjet porque es el elemento que disparó el evento
            Buttons.changeButtonEvent(event, Buttons.botones.btnUpdate.id, Buttons.botones.btnUpdate.ruta, Buttons.botones.btnUpdate.title); // Cambia el botón de editar a guardar

            // no funciona con getElementById porque no es un nodo de documento, es una celda
            const deleteButton = rowEdit.querySelector('#btnEliminar'); // Selecciona el botón de eliminar
            Buttons.changeButtonNotEvent(deleteButton, Buttons.botones.btnCancel.id, Buttons.botones.btnCancel.ruta, Buttons.botones.btnCancel.title); // Cambia el botón de eliminar a cancelar

            return; // Salir de la función después de editar
        }


        // Eliminar producto por ID

        if (event.target.id.startsWith('btnEliminar')) {
            const rowDelete = event.target.closest('tr'); // Encuentra la fila más cercana al botón
            const id = rowDelete.querySelectorAll('td')[0].textContent; // Obtiene el ID de la celda correspondiente


            const deleteProduct = await apiEndPoints.deleteProduct(id)
            if (deleteProduct.estado) {
                mostrarAlerta(deleteProduct.mensaje, "alert alert-success");
                rowDelete.remove(); // Elimina la fila de la tabla
                actualizarDashboard();
            }



            // Ocultar la tabla si no hay más filas
            if (document.querySelectorAll('#tbodyProductos tr').length === 0) {
                ocultarTablaProductos();
            }
        }



        if (event.target.id === 'btnUpdate') {

            const rowSave = event.target.closest('tr');
            const id = rowSave.querySelectorAll('td')[0].textContent;
            const input = rowSave.querySelectorAll('input'); // Selecciona todas las celdas de la fila

            // Obtener todos los datos de la fila
            const datos_fila = {
                codigoBarra: id,
                nombre: input[0].value,
                precio: input[1].value,
                existencia: input[2].value,
                IDmarca: input[3].value,
                IDcategoria: input[4].value
            };


            // Enviar datos a endPoints
            const response_update = await apiEndPoints.updateProduct(datos_fila);

            if (response_update.estado) {
                mostrarAlerta(response_update.mensaje, "alert alert-success");

                // Actualizar solo la fila editada sin hacer otra petición al servidor
                const celdas = rowSave.querySelectorAll('td');
                celdas[1].textContent = datos_fila.nombre;
                celdas[2].textContent = datos_fila.precio;
                celdas[3].textContent = datos_fila.existencia;
                celdas[4].textContent = datos_fila.IDmarca;
                celdas[5].textContent = datos_fila.IDcategoria;

                // Restaurar botones a su estado original
                Buttons.changeButtonEvent(event, Buttons.botones.btnEdit.id, Buttons.botones.btnEdit.ruta, Buttons.botones.btnEdit.title);

                const cancelButton = rowSave.querySelector('#btnCancelar');
                Buttons.changeButtonNotEvent(cancelButton, Buttons.botones.btnDelete.id, Buttons.botones.btnDelete.ruta, Buttons.botones.btnDelete.title);

            } else if (response_update.error) {
                mostrarAlerta("Error desconocido con el servidor o sentencia SQL!!", "alert alert-danger");
            } else {
                mostrarAlerta(response_update.mensaje, "alert alert-danger");
            }

            return; // Salir de la función después de guardar
        }

        if (event.target.id === 'btnCancelar') {
            const rowCancel = event.target.closest('tr');
            const cells = rowCancel.querySelectorAll('input'); // Selecciona todas las celdas de la fila

            // Verifica que datosCeldas tenga los valores esperados
            if (datosCeldas.length !== cells.length) {
                console.error('El array datosCeldas no coincide con el número de celdas.');
                return; // Salir si hay un problema con los datos
            }

            cells.forEach((cell, index) => {
                if (index < cells.length) { // Evita la última celda (acciones)
                    const valorActual = datosCeldas[index]; // Obtiene el valor actual del campo de entrada
                    cell.parentNode.textContent = valorActual; // Establece el nuevo valor en la celda
                }
            });


            Buttons.changeButtonEvent(event, Buttons.botones.btnDelete.id, Buttons.botones.btnDelete.ruta, Buttons.botones.btnDelete.title); // Cambia el botón de cancelar a eliminar
            // no funciona con getElementById porque no es un nodo de documento, es una celda
            const saveButton = rowCancel.querySelector('#btnUpdate'); // Selecciona el botón de guardar
            Buttons.changeButtonNotEvent(saveButton, Buttons.botones.btnEdit.id, Buttons.botones.btnEdit.ruta, Buttons.botones.btnEdit.title); // Cambia el botón de guardar a editar
            return; // Salir de la función después de cancelar
        }

    });
});







document.getElementById("btnConection").addEventListener("click", async () => {
    const resultado = await conection.establecerConexion(); // Llamar a la función para establecer la conexión
    //console.log(resultado); // Muestra el resultado en la consola
    if (resultado.estadoDB) {
        mostrarAlerta(resultado.estadoDB, 'alert alert-success');
    } else if (resultado.errorDB) {
        mostrarAlerta(resultado.errorDB, 'alert alert-danger');
    }
    else if (resultado.errorServer) {
        mostrarAlerta(resultado.errorServer, 'alert alert-warning');
    }

    // mostrarAlerta(resultado.dato, 'alert alert-success'); // Muestra el JSON de forma legible
});


document.getElementById('frmAltaProducto').addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita el envío del formulario
    const form = event.target; // Obtiene el formulario actual

    //Verificar si el formulario está válidado
    if (!form.checkValidity()) {
        form.classList.add('was-validated'); // Agrega estilos de validación de Bootstrap
        return; // Detiene la ejecución si el formulario no está válidado
    }

    const formData = new FormData(form); // Crea un objeto FormData con los datos del formulario
    const plainData = Object.fromEntries(formData.entries()); // convertir FormData a un objeto plano


    const responseCreateProduct = await apiEndPoints.createProduct(plainData); // Llamar a la función para crear el producto

    if (responseCreateProduct.errorServer || responseCreateProduct.errorBD || responseCreateProduct.error) {
        console.log(responseCreateProduct.errorServer || responseCreateProduct.errorBD || responseCreateProduct.error);
        mostrarAlerta(responseCreateProduct.errorServer || responseCreateProduct.errorBD || responseCreateProduct.error, "alert alert-danger");
        return;
    }

    if (responseCreateProduct.estado) {
        mostrarAlerta(responseCreateProduct.mensaje, "alert alert-success");
        resetearFormulario(form);
        actualizarDashboard(); // refresca el contador de productos en el dashboard
    }


});




document.getElementById('btnShowProducts').addEventListener('click', async () => {
    const resultProducts = await apiEndPoints.selectAllProducts(); // Llamar a la función para obtener todos los productos
    const tbody = document.getElementById('tbodyProductos'); // obtener el cuerpo de la tabla

    //console.log(resultProducts); // // Muestra los datos en la consola resultProducts[0]

    if (resultProducts.length === 0 || resultProducts.errorDB) {
        mostrarAlerta("Error en la consulta o no hay datos que mostrar", "alert alert-danger");
        ocultarTablaProductos();
        return; // Detiene la ejecución si hay un error y no es necesario agregar un else
    }

    if (resultProducts.errorServer) {
        mostrarAlerta("Error de conexión con el servidor!!", "alert alert-danger")
        ocultarTablaProductos();
        return;
    }

    agregarFilaTabla(resultProducts, tbody);// Agregar los datos a la tabla
    mostrarTablaProductos(); // Mostrar la tabla de productos 

});









document.getElementById('btnDeleteAllProducts').addEventListener('click', function () {
    // Limpia las filas del DOM y oculta la tabla
    document.getElementById('tbodyProductos').textContent = '';
    ocultarTablaProductos();
});

const agregarFilaTabla = (dataDB, tbody) => {

    tbody.textContent = "";

    for (const data of dataDB) {
        const newRow = document.createElement('tr');

        const propiedades = ["codigoBarra", "nombre", "precio", "existencia", "IDmarca", "IDcategoria"];
        propiedades.forEach(propiedad => {
            createCell(newRow, data[propiedad]);
        });

        const actionsCell = document.createElement('td');
        const editButton = document.createElement('img');
        const deleteButton = document.createElement('img');
        // Crea el boton de guardar
        Buttons.crearBotonesAcciones(actionsCell, editButton, Buttons.botones.btnEdit.id, Buttons.botones.btnEdit.ruta, Buttons.botones.btnEdit.title);
        // Crea el boton de Eliminar
        Buttons.crearBotonesAcciones(actionsCell, deleteButton, Buttons.botones.btnDelete.id, Buttons.botones.btnDelete.ruta, Buttons.botones.btnDelete.title);

        // Agregar la celda de acciones a la fila
        newRow.appendChild(actionsCell);

        // Agregar la nueva fila al cuerpo de la tabla
        tbody.appendChild(newRow);
    }

}


function createCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.appendChild(cell);
}


// Funciones =====================================

function resetearFormulario(form) {
    form.reset();
    const rangoCantidad = document.getElementById('rngCantidad');
    rangoCantidad.value = 100; // Reinicia el valor del rango a 100
    rangoCantidad.nextElementSibling.value = rangoCantidad.value; // Sincroniza el <output> con el rango
}


function mostrarTablaProductos() {
    const divListaProductos = document.getElementById('divListaProductos');
    divListaProductos.style.display = 'block'; // Muestra la tabla
}

function ocultarTablaProductos() {
    const divListaProductos = document.getElementById('divListaProductos');
    divListaProductos.style.display = 'none'; // Oculta la tabla
}

function mostrarAlerta(msg, tipoAlerta) {
    try {

        const divresponseInformation = document.getElementById("responseInformation");
        divresponseInformation.textContent = msg;
        divresponseInformation.className = tipoAlerta;
        divresponseInformation.style.display = "block";
        divresponseInformation.classList.add("fade-in");

        setTimeout(() => {
            divresponseInformation.classList.add("fade-out");
            setTimeout(() => {
                divresponseInformation.style.display = "none";
                divresponseInformation.classList.remove("fade-in", "fade-out");
            }, 2000); // Tiempo de duración de la animación (1 segundo)
        }, 7000); // Tiempo de visualización del mensaje antes de desaparecer (2 segundos)

    } catch (error) {
        console.log("Error en mostrar alerta: " + error);
    }
}


// ── Cerrar sesión ────────────────────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', function () {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
});


// ── Cerrar sesión ────────────────────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', function () {
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
});

// ── Dashboard ────────────────────────────────────────────────────────────────
// Función independiente para poder llamarla tanto al cargar como tras cada alta
function actualizarDashboard() {
    apiEndPoints.selectAllProducts().then(function (productos) {
        const tarjeta = document.getElementById('dashTotalProductos');
        if (!tarjeta) return;
        tarjeta.textContent = Array.isArray(productos) ? productos.length : 'Error';
    });
}
