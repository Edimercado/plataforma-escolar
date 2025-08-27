const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Tu carpeta con HTML

// Conexión a MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/plataforma_colombo", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error de conexión:", err));

// Esquema de usuario
const usuarioSchema = new mongoose.Schema({
  usuario: String,
  clave: String,
  correo: String,
  rol: String,
  grado: String,  // Para estudiantes
  materia: String  // Para docentes
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

// Esquema para asignaturas por curso
const asignaturaSchema = new mongoose.Schema({
  curso: String,  // Ej: "6A", "7B", etc.
  materias: [String]  // Array de materias
});

const Asignatura = mongoose.model("Asignatura", asignaturaSchema);

app.post("/login", async (req, res) => {
  const { usuario, clave, rol } = req.body;
  try {
    const user = await Usuario.findOne({ usuario, clave, rol });
    if (user) {
      // Enviar también los datos del usuario
      res.json({ success: true, message: "Login exitoso", usuario: user });
    } else {
      res.json({ success: false, message: "Usuario o clave incorrectos" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// Ruta para obtener asignaturas por curso
app.get("/asignaturas/:curso", async (req, res) => {
  try {
    const curso = req.params.curso;
    console.log(`🔍 Buscando asignaturas para curso: ${curso}`);

    const asignaturas = await Asignatura.findOne({ curso });
    console.log(`📚 Resultado encontrado:`, asignaturas);

    if (asignaturas) {
      console.log(`✅ Enviando ${asignaturas.materias.length} materias`);
      res.json({ success: true, materias: asignaturas.materias });
    } else {
      console.log(`⚠️ No se encontraron asignaturas para curso: ${curso}`);
      res.json({ success: true, materias: [] });
    }
  } catch (err) {
    console.error("❌ Error al obtener asignaturas:", err);
    res.status(500).json({ success: false, message: "Error al obtener asignaturas" });
  }
});

// Ruta para obtener todos los usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener usuarios" });
  }
});

// Ruta para registrar un usuario
app.post("/registrar", async (req, res) => {
  const { usuario, clave, correo, rol, grado, materia } = req.body;

  if (!usuario || !clave || !correo || !rol) {
    return res.status(400).json({ success: false, message: "Faltan campos obligatorios" });
  }

  try {
    const existe = await Usuario.findOne({ usuario });
    if (existe) {
      return res.status(400).json({ success: false, message: "El usuario ya existe" });
    }

    const nuevoUsuario = new Usuario({ usuario, clave, correo, rol, grado, materia });
    await nuevoUsuario.save();

    res.json({ success: true, message: "Usuario registrado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al registrar usuario" });
  }
});

// Obtener datos de un usuario por nombre de usuario
app.get("/usuario/:usuario", async (req, res) => {
  try {
    const user = await Usuario.findOne({ usuario: req.params.usuario });
    if (!user) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener usuario" });
  }
});

// Servir panel.html
app.get("/panel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "panel.html"));
});

// Servir login.html
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Eliminar usuario
app.delete("/usuario/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioEliminado = await Usuario.findByIdAndDelete(id);

    if (!usuarioEliminado) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al eliminar usuario" });
  }
});

// Actualizar usuario
app.put("/usuario/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, correo, rol, grado, materia } = req.body;

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { usuario, correo, rol, grado, materia },
      { new: true }
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, message: "Usuario actualizado correctamente", usuario: usuarioActualizado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al actualizar usuario" });
  }
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});