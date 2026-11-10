const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para procesar el Login (Devuelve el grupo actualizado desde users.json)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    fs.readFile(path.join(__dirname, 'data/users.json'), 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        let db = { users: [] };
        try { db = JSON.parse(data); } catch (e) {}

        const user = db.users.find(u => u.username === username && u.password === password);

        if (user) {
            res.json({ 
                success: true, 
                user: { 
                    name: user.name || `${user.nombre} ${user.appPaterno}`, 
                    role: user.role, 
                    grupo: user.grupo || 'N/A' 
                } 
            });
        } else {
            res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
        }
    });
});

// Obtener lista completa de usuarios (Admin)
app.get('/api/admin/users', (req, res) => {
    fs.readFile(path.join(__dirname, 'data/users.json'), 'utf8', (err, data) => {
        if (err) {
            return res.json({ users: [] });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json({ users: [] });
        }
    });
});

// Registrar o Agregar Usuario (Admin)
app.post('/api/admin/users', (req, res) => {
    const newUser = req.body;
    const filePath = path.join(__dirname, 'data/users.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        let db = { users: [] };
        if (!err && data) { try { db = JSON.parse(data); } catch (e) {} }

        newUser.id = Date.now();
        db.users.push(newUser);

        fs.writeFile(filePath, JSON.stringify(db, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Error al guardar' });
            res.json({ success: true, user: newUser });
        });
    });
});

// Eliminar Usuario por ID (Admin)
app.delete('/api/admin/users/:id', (req, res) => {
    const userId = Number(req.params.id);
    const filePath = path.join(__dirname, 'data/users.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al leer datos' });
        let db = JSON.parse(data);
        db.users = db.users.filter(u => u.id !== userId);

        fs.writeFile(filePath, JSON.stringify(db, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Error al eliminar' });
            res.json({ success: true });
        });
    });
});

// Obtener Grupos Académicos
app.get('/api/admin/groups', (req, res) => {
    fs.readFile(path.join(__dirname, 'data/groups.json'), 'utf8', (err, data) => {
        if (err) {
            return res.json({ groups: ['4IV1', '4IV2', '5IV1'] });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json({ groups: ['4IV1', '4IV2', '5IV1'] });
        }
    });
});

// Guardar / Actualizar Grupos Académicos
app.post('/api/admin/groups', (req, res) => {
    const { groups } = req.body;
    const filePath = path.join(__dirname, 'data/groups.json');

    fs.writeFile(filePath, JSON.stringify({ groups }, null, 2), (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al guardar grupos' });
        res.json({ success: true });
    });
});

// Obtener el horario de un grupo específico
app.get('/api/admin/schedules/:group', (req, res) => {
    const groupName = req.params.group;
    const filePath = path.join(__dirname, 'data/schedules.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.json({ schedule: [] });
        try {
            const db = JSON.parse(data);
            res.json({ schedule: db[groupName] || [] });
        } catch (e) {
            res.json({ schedule: [] });
        }
    });
});

// Guardar o actualizar el horario de un grupo
app.post('/api/admin/schedules', (req, res) => {
    const { group, schedule } = req.body;
    const filePath = path.join(__dirname, 'data/schedules.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        let db = {};
        if (!err && data) {
            try { db = JSON.parse(data); } catch (e) {}
        }
        db[group] = schedule;

        fs.writeFile(filePath, JSON.stringify(db, null, 2), (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Error al guardar horario' });
            res.json({ success: true });
        });
    });
});

// Ruta para obtener notificaciones
app.get('/api/notifications', (req, res) => {
    fs.readFile(path.join(__dirname, 'data/notifications.json'), 'utf8', (err, data) => {
        if (err) {
            return res.json({ notifications: [] });
        }
        try { res.json(JSON.parse(data)); } catch(e) { res.json({ notifications: [] }); }
    });
});

// Ruta para enviar notificaciones (Docentes)
app.post('/api/notifications', (req, res) => {
    const { teacherName, classroom, message } = req.body;
    const filePath = path.join(__dirname, 'data/notifications.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        let db = { notifications: [] };
        if (!err && data) {
            try { db = JSON.parse(data); } catch (e) {}
        }

        const newNotification = {
            id: Date.now(),
            teacherName,
            classroom,
            message,
            timestamp: new Date().toLocaleTimeString()
        };

        db.notifications.unshift(newNotification);

        fs.writeFile(filePath, JSON.stringify(db, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error al guardar' });
            }
            res.json({ success: true, notification: newNotification });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${PORT}`);
});