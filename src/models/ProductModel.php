<?php

class ProductModel
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function insertar($tabla, $datosFormulario)
    {
        try {
            $mapeo = [
                'codigobarra' => 'txtCodigoBarra',
                'nombre'      => 'txtNombre',
                'precio'      => 'txtPrecio',
                'existencia'  => 'rngCantidad',
                'idmarca'     => 'cboMarca',
                'idcategoria' => 'cboCategoria'
            ];

            foreach ($mapeo as $claveBD => $claveForm) {
                if (!isset($datosFormulario[$claveForm])) {
                    throw new Exception("Falta el campo del formulario: $claveForm");
                }
            }

            if (trim($datosFormulario['txtCodigoBarra']) === '') {
                throw new Exception("El ID no puede estar vacío");
            }

            $campos = array_keys($mapeo);
            $valores = array_map(fn($campo) => $datosFormulario[$mapeo[$campo]], $campos);

            $placeholders = implode(', ', array_fill(0, count($campos), '?'));
            $sql = "INSERT INTO `$tabla` (`" . implode('`, `', $campos) . "`) VALUES ($placeholders)";

            $statement = $this->conn->prepare($sql);
            if (!$statement) {
                throw new Exception("Error al preparar la consulta: " . $this->conn->errorInfo()[2]);
            }

            $statement->execute($valores);

            return ['estado' => true, 'mensaje' => 'Datos insertados correctamente'];

        } catch (PDOException $e) {
            return ["errorBD" => "Error en la inserción: " . $e->getMessage()];
        } catch (Exception $e) {
            return ["error" => "Error: " . $e->getMessage()];
        }
    }

    public function eliminar($tabla, $datosFormulario)
    {
        try {
            $id = $datosFormulario ?? null;

            $sql = "DELETE FROM `$tabla` WHERE `codigoBarra` = ?";
            $statement = $this->conn->prepare($sql);
            if (!$statement) {
                throw new Exception("Error al preparar la consulta: " . $this->conn->errorInfo()[2]);
            }

            $statement->execute([$id]);

            if ($statement->rowCount() > 0) {
                return ['estado' => true, 'mensaje' => 'Registro eliminado correctamente'];
            } else {
                return ['estado' => false, 'mensaje' => 'No se encontró el registro para eliminar'];
            }
        } catch (Exception $e) {
            return ["error" => "Error: " . $e->getMessage()];
        }
    }

    public function actualizar($tabla, $datosFormulario)
    {
        try {
            $id = $datosFormulario['codigoBarra'];

            $mapeo = [
                'nombre'      => 'nombre',
                'precio'      => 'precio',
                'existencia'  => 'existencia',
                'idmarca'     => 'IDmarca',
                'idcategoria' => 'IDcategoria'
            ];

            $campos = array_keys($mapeo);
            $valores = array_map(fn($campo) => $datosFormulario[$mapeo[$campo]], $campos);

            $setClause = implode(', ', array_map(fn($campo) => "`$campo` = ?", $campos));
            $sql = "UPDATE `$tabla` SET $setClause WHERE `codigoBarra` = ?";

            $statement = $this->conn->prepare($sql);
            if (!$statement) {
                throw new Exception("Error al preparar la consulta: " . $this->conn->errorInfo()[2]);
            }

            $valores[] = $id;
            $statement->execute($valores);

            if ($statement->rowCount() > 0) {
                return ['estado' => true, 'mensaje' => 'Registro actualizado correctamente'];
            } else {
                return ['estado' => false, 'mensaje' => 'No se encontró el registro para actualizar o no se realizó ningún cambio'];
            }
        } catch (Exception $e) {
            return ["error" => "Error: " . $e->getMessage()];
        }
    }
}