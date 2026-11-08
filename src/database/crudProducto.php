<?php

header('Content-Type: application/json'); // Esta línea indica al navegador que el contenido es JSON

require_once 'connection.php'; // Incluye el archivo de conexión a la base de datos
require_once __DIR__ . '/../models/ProductModel.php';

try{
    
    $conn = ConexionDB::setConnection(); // Obtiene la conexión a la base de datos
    // “Toma los datos JSON crudos que llegaron al servidor desde dataManager.js, los decodifíca, y conviértes en un arreglo PHP”.

    // “Toma los datos JSON crudos que llegaron al servidor desde dataManager.js, los decodifíca, y conviértes en un arreglo PHP”.
    $entrada = json_decode(file_get_contents('php://input'), true);

    
    /*variable entrada muestra algo como esto:
        datosFormulario: {txtCodigoBarra: "546", txtNombre: "sredtr", txtPrecio: "5.6", rngCantidad: "29", cboMarca: "M007",…}
        tabla:"producto"
    */

    $tabla=$entrada['tabla'] ?? null; // si el nombre de la tabla está vacia asigna null
    $datosFormulario=$entrada['datosFormulario'] ?? [];
    $operacion = $entrada['operacion']?? null;

    $model = new ProductModel($conn);

    switch($operacion){
        case 'create':
            echo json_encode($model->insertar($tabla, $datosFormulario));
            break;
        case 'read':
            echo json_encode($model->leer($tabla, $datosFormulario));
            break;
        case 'update':
            echo json_encode($model->actualizar($tabla, $datosFormulario));
            break;
        case 'delete':
            echo json_encode($model->eliminar($tabla, $datosFormulario)); break;
        default:
            throw new Exception("Operación no válida");
    }

}

// este se lanza si hay algun error de conexion a la base de datos
catch(Exception $e) {
            echo json_encode(["error" => "Error: " . $e->getMessage()]);
        }
    
?>

