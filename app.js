var nodemailer = require('nodemailer'),
    scheduler = require('node-schedule'),
    bodyParser = require('body-parser'),
    express = require('express'),
    app = express(),
    path = require('path'),
    postgresHandle = require('pg');

app.use(express.static("static"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//Database
/*
postgresHandle.defaults.ssl = true;
var config = {
    user: 'jsvjxaxivutiid',
    database: 'd3mltsg5qh11fe',
    password: 'Iu3pdH2BccKgOWDsmPT_QqPhoD',
    host: 'ec2-174-129-209-53.compute-1.amazonaws.com',
    port: 5432,
    max: 12,
    idleTimeoutMillis: 30000
};
var postgresPool = new postgresHandle.Pool(config);
*/
//nodemailer config
var mailer = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'sathyashan91@gmail.com',
        pass: 'Sathya12s'
    }
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/api/notify', function (req, res) {
    console.log(new Date(req.body.notifyTime));
    scheduler.scheduleJob(new Date(req.body.notifyTime), function () {
        var mailOptions = {
            from: 'sathyashan91@gmail.com', // sender address
            to: req.body.email, // list of receivers
            subject: 'Reminder - Book a Uber ride', // Subject line
            html: "<div>Hi " + req.body.name + ",</div><br/><div>Hurry! Its time to book a uber ride from " + req.body.origin + " to " + req.body.destination + "</div><br/>" + "<div>Please do not reply to this mail</div>"
        };
        mailer.sendMail(mailOptions, function (mailererr, mailerres) {
            if (!mailererr) {
                console.log("email sent");
            }
            else {
                endConnection();
                console.log("not sent " + mailererr);
            }
        });
    });
    res.send("success");
});

/*
app.post('/api/notify', function (req, res) {
    postgresPool.connect(function (err, client, done) {
        if (!err) {
            var stmt = "INSERT INTO UberRemainder (name, email, origin, destination, notification_time, time) VALUES('" + req.body.name + "','" + req.body.email + "','" + req.body.origin + "','" + req.body.destination + "','" + req.body.notifyTime + "','" + req.body.time + "')";
            client.query(stmt, function (qerr, qres) {
                done();
                if (!qerr) {
                    //on successfull query execution
                    if (qres.rowCount == 1)
                        res.send("success");
                    else
                        res.send("unsuccess");
                }
                else {
                    console.log("query" + qerr);
                    res.send("unsuccess");
                }
            });
        }
        else {
            console.log("error" + err);
            res.send("unsuccess");
        }

    });
});*/

//Scheduler that runs every 1 minute
//checks for notification in db, if any it sends mail to stored email
/*** 
var j = scheduler.scheduleJob('* 1 * * * *', function () {
    var d = new Date();
    d.setSeconds(0);
    d.setMilliseconds(0);

    postgresPool.connect(function (err, client, endConnection) {
        if (!err) {
            //on successfully conncection
            client.query("SELECT * FROM UberRemainder WHERE notification_time ='" + d.toUTCString() + "'", function (error, response) {
                if (!error) {
                    var queryResponse = response.rows, idsString = "";
                    console.log(queryResponse);
                    if (queryResponse.length >= 1) {
                        for (var i = 0; i < queryResponse.length; i++) {
                            idsString += (i + 1 === queryResponse.length) ? queryResponse[i].id : (queryResponse[i].id + ",");
                            var mailOptions = {
                                from: 'sathyashan91@gmail.com', // sender address
                                to: queryResponse[i].email, // list of receivers
                                subject: 'Reminder - Book a Uber ride', // Subject line
                                html: "<div>Hi " + queryResponse[i].name + ",</div><br/><div>Hurry! Its time to book a uber ride from " + queryResponse[i].origin + " to " + queryResponse[i].destination + "</div><br/>" + "<div>Please do not reply to this mail</div>" // plaintext body
                            };

                            mailer.sendMail(mailOptions, function (mailererr, mailerres) {
                                if (!mailererr) {
                                    console.log("email sent");
                                    var delStmt = "DELETE FROM UberRemainder WHERE id IN (" + idsString + ")";
                                    //now delete the expired records
                                    client.query(delStmt, function (qerr, qres) {
                                        endConnection();
                                    });
                                }
                                else {
                                    endConnection();
                                    console.log("not sent " + mailererr);
                                }
                            });
                        }
                    } else {
                        endConnection();
                    }
                }
                else {
                    endConnection();
                }
            });
        }
    });

});
*/
var port = Number(process.env.PORT || 8092);
app.listen(port, function () {
    console.log("server running");
});
