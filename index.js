var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const mysql = require('mysql');
const TwinBcrypt = require('twin-bcrypt')
const jwt = require('jsonwebtoken')
// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });


const connection = mysql.createPool({
    host: `https://www.db4free.net`,
    user: `ndevs260340`,
    password: `z$6ZvpD!a5zRwL$`,
    database: `ndevs_test`
})

// connection.connect(function (err) {
//     if (err) throw err;

//     console.log("Connected!");
// })
function Login(email, password) {
    console.log(email, password);
    let promise = new Promise(async (resolve, reject) => {
        await connection.query(`SELECT * FROM users WHERE email = ?`, email, (err, res) => {
            console.log(res);
            if (err) {
                console.log(err);
                console.log('err');
                resolve({
                    open: true,
                    msg: "รหัสไม่ถูกต้อง",
                    severity: "error"
                })
            } else if (res.length !== 0) {
                TwinBcrypt.compare(password, res[0].password, function (tb) {

                    console.log(tb);
                    if (tb) {
                        console.log({
                            open: true,
                            msg: "เข้าสู่ระบบแล้ว",
                            severity: "success"
                        });

                        let token = jwt.sign({
                            status: true
                        }, "LOGIN")
                        resolve({
                            open: true,
                            msg: "เข้าสู่ระบบแล้ว",
                            severity: "success",
                            token: token
                        })
                    } else {
                        console.log({
                            open: true,
                            msg: "รหัสไม่ถูกต้อง",
                            severity: "error"
                        });
                        resolve({
                            open: true,
                            msg: "รหัสไม่ถูกต้อง",
                            severity: "error"
                        })

                    }
                })

            } else {
                console.log("null");
                resolve({
                    open: true,
                    msg: "รหัสไม่ถูกต้อง",
                    severity: "error"
                })
            }
        })

    })
    return promise
}

async function Dashboard(token) {
    let promise = new Promise((resolve, reject) => {
        jwt.verify(token, "LOGIN", (error, decode) => {
            if (error) {
                reject({ status: false })
                // console.log(error);
            }
            // console.log(decode);
            resolve({ status: true })

        })
    })

    return await promise
}

function Create(newData) {
    let promise = new Promise(async (resolve, reject) => {
        await connection.query(`INSERT INTO blogs SET ?`, { ...newData }, (err, res) => {
            if (err) {
                resolve({
                    open: true,
                    msg: "error create blog",
                    severity: "error"
                })
            } else {
                reject({
                    open: true,
                    msg: "สร้างบทความเสร็จสิ้น",
                    severity: "success"
                })
            }
        })
    })

    return promise
}

function GetAll() {
    let promise = new Promise(async (resolve, reject) => {
        await connection.query(`SELECT * FROM blogs`, (err, res) => {
            // console.log(res);
            if (err) {
                reject({
                    open: true,
                    msg: "error get blog all",
                    severity: "error"
                })
            }
            resolve(res)

        })
    })

    return promise
}

function Search(find) {
    let promise = new Promise(async (resolve, reject) => {
        await connection.query(`SELECT * FROM blogs 
        WHERE blogs.title LIKE '%${find}%' 
        OR blogs.region LIKE '%${find}%'
        OR blogs.county LIKE '%${find}%'`, (err, res) => {
            // console.log(res);
            if (err) {
                reject({
                    open: true,
                    msg: "error get blog search",
                    severity: "error"
                })
            }
            resolve(res)

        })
    })

    return promise
}

function GetID(id) {
    let promise = new Promise(async (resolve, reject) => {
        await connection.query(`SELECT * FROM blogs WHERE id = ?`, [id], (err, res) => {
            if (err) {
                reject({
                    open: true,
                    msg: "error get blog all",
                    severity: "error"
                })
            }
            resolve(res[0])

        })
    })

    return promise
}


function Update(find, newData) {
    const find_keys = Object.keys(find);
    const find_values = Object.values(find);
    const data_key = Object.keys(newData);
    const data_values = Object.values(newData);

    const sqlstring = [];

    data_key.map((data_key, index) => {
        sqlstring.push(`${data_key} = '${data_values[index]}'`)
    })

    let promise = new Promise(async (resolve, reject) => {
        console.log('sqlstring',sqlstring);
        await connection.query(`UPDATE blogs SET ${sqlstring} WHERE ${find_keys[0]} = '${find_values[0]}'`, (err, res) => {
            if (err) {
                reject({
                    open: true,
                    msg: "error update blog",
                    severity: "error"
                })
            }
            resolve({
                open: true,
                msg: "อัพเดตบทความเสร็จสิ้น",
                severity: "success"
            })

        })
    })

    return promise
}

function Remove(find) {
    console.log('remove id',find);
    const find_keys = Object.keys(find);
    const find_values =Object.values(find)
    let promise = new Promise(async (resolve, reject) => {
        await connection.query(`DELETE FROM blogs WHERE ${find_keys[0]} = ?`, find_values[0], (err, res) => {
            if (err) {
                reject({
                    open: true,
                    msg: "error get blog all",
                    severity: "error"
                })
            }
            resolve({
                open: true,
                msg: "ลบบทความเสร็จสิ้น",
                severity: "success"
            })

        })
    })

    return promise
}

io.on('connection', (socket) => {

    console.log('a user connected');

    // เมื่อ Client ตัดการเชื่อมต่อ
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })

    socket.on('login', (data) => {
        Login(data.email, data.password).then(_data => {
            socket.emit('login', _data);
        })

    })

    socket.on('create_blog', (data) => {
        Create(data).then(_data => {
            socket.emit('create_blog', _data);
        }, _err => {
            socket.emit('create_blog', _err);
        })

    })

    socket.on('update_blog', (id,data) => {
        console.log(id,data);
        Update(id, data).then(_data => {
            socket.emit('update_blog', _data);
        }, _err => {
            socket.emit('update_blog', _err);
        })

    })

    socket.on('get_all_blog', (data) => {
        GetAll().then(_data => {
            console.log(_data);
            socket.emit('get_all_blog', _data);
        }, _err => {
            socket.emit('get_all_blog', _err);
        })

    })

    socket.on('get_id_blog', (id) => {
        GetID(id).then(_data => {
            socket.emit('get_id_blog', _data);
        }, _err => {
            socket.emit('get_id_blog', _err);
        })

    })

    socket.on('remove_id_blog', (id) => {
        Remove(id).then(_data => {
            socket.emit('remove_id_blog', _data);
        }, _err => {
            socket.emit('remove_id_blog', _err);
        })

    })

    socket.on('search_blog', (find) => {
        Search(find).then(_data => {
            socket.emit('search_blog', _data);
        }, _err => {
            socket.emit('search_blog', _err);
        })

    })

    socket.on('dashboard', (token) => {
        console.log(token);
        Dashboard(token).then(_token => {
            socket.emit('dashboard', _token);
        })
    })


});

http.listen(9000, () => {
    console.log('listening on *:9000');
});

