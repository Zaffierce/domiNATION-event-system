'use strict'

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';

const express = require('express');
const cookieParser = require('cookie-parser');
const superagent = require('superagent');
const pg = require('pg');
const app = express();
app.use(cookieParser());
const { catchAsync } = require('./util/utils');
const { render } = require('ejs');
require('dotenv').config();

const DISCORD_STUDENT_ADMIN_GROUP_ID = process.env.DISCORD_STUDENT_ADMIN_GROUP_ID;
const DISCORD_ADMIN_GROUP_ID = process.env.DISCORD_ADMIN_GROUP_ID;
const DISCORD_PATREON_SUPPORTER = process.env.DISCORD_PATREON_SUPPORTER;
const DISCORD_PATREON_SUPPORTERPLUS = process.env.DISCORD_PATREON_SUPPORTERPLUS;
const DISCORD_PATREON_SUPPORTERPLUSPLUS = process.env.DISCORD_PATREON_SUPPORTERPLUSPLUS;
const DISCORD_PATREON_DOMINATOR = process.env.DISCORD_PATREON_DOMINATOR;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const PORT = process.env.PORT || 3002;
const TOKEN = process.env.TOKEN;

app.set('view engine', 'ejs');

const client = new pg.Client(process.env.DATABASE_URL);

app.use(express.urlencoded({extended: true}));
app.use(express.static('./public'));

app.get('/', catchAsync(async(req, res) => {
    if (req.cookies[TOKEN] == null) {
      res.redirect('/login');
    } else {
      const validateUser = await authenticateUser(req.cookies[TOKEN]);
      if (validateUser.isFound === false) {
          //TODO: Add user_not_found page
        res.render('./pages/user_not_found', {
          user: validateUser
        });
      } else {
        // const eventImages = [];
        const eventData = await fetchCalendar();
        //TODO: Render each image pulled from the database and associate it with the appropriate event
        // const eventImages = await eventData.rows.forEach(e => {
        //   return client.query(`SELECT * FROM events_images WHERE event_id = '${e.id}'`)
        // })
        // console.log(eventImages)
        //.then(sqlRes => {
            // if (sqlRes.rowCount > 0) {
              // console.log("Pushing Data")
              // console.log(sqlRes.rows)
              // eventImages.push(sqlRes.rows)
              // return sqlRes.rows;
            // }
          //});
        // })
        // const eventImages = await client.query('SELECT * FROM events_images')
        // console.log(eventData.rows)
        res.render('./pages/public/index', {
          user: validateUser,
          events: eventData.rows
          // event_image : eventImages.rows
        });
      }
    }
}));

app.get('/test', catchAsync(async(req, res) => {
  const eventData = await fetchCalendar();
  // console.log(banana.rows);


}));

async function fetchCalendar() {
    
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), listEvents);
  });
  
  function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }

  function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }

  async function listEvents(auth) {
    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.list({
      calendarId: GOOGLE_CALENDAR_ID,
      timeMin: (new Date()).toISOString(),
      maxResults: 11,
      singleEvents: true,
      orderBy: 'startTime',
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      const events = res.data.items;
      console.log(events);
      // console.log(events[0]);
      if (events.length) {
        const curr10Events = events.map((event) => {
          return new Event(event, true)
        });
        curr10Events.forEach(e => {
          //console.log(curr10Events);
          client.query(`SELECT * FROM events where id = '${e.id}'`).then(sqlRes => {
            if (sqlRes.rowCount < 1) {
              console.log("Inserting new data into database");
              // let date = e.event_start_date.slice(0, 10).split("-");
              let date_am_pm = formatAMPM(new Date(e.event_start_date));
              let formattedDate = new Date(e.event_start_date).toDateString();
              // let formattedDate = new Date(e.event_start_date).toUTCString();
              // let start_time = e.event_start_date.slice(11,16);
              let timezone = e.event_start_date.slice(19, 25);
              let start_date_ms = Date.parse(new Date(e.event_start_date));
              // let modifiedDate = `${date[1]}/${date[2]}/${date[0]} ${start_time} ${timezone}`;
              // let date_ms = new Date(e.event_start_date).toDateString();
              // let date_ms = e.event_start_date;
              let sqlArr = [e.id, e.created_date, start_date_ms, formattedDate, date_am_pm, timezone, e.summary, e.descrption];
              // console.log(new Date(date_ms).toDateString())
              let sql = 'INSERT INTO events (id, created_date, start_date_ms, start_date, time, timezone, summary, description, showevent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE);';
              client.query(sql, sqlArr);

              if (e.attachments) {
                e.attachments.forEach(attachment => {
                  sqlArr = [e.id, attachment.fileId];
                  sql = 'INSERT INTO events_images (event_id, file_id) VALUES ($1, $2);';
                  client.query(sql, sqlArr)
                }) 
              } else {
                console.log("No attachments found")
              }
            } else {
              // console.log("Data exists for this record already.")
            }
          })
        });
      } else {
        //TODO:  Throw error because no events are found.
        console.log('No upcoming events found.');
      }
    });
  }

  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

  async function fetchEvents() {
    // fetchCalendar();
    const thirtyDaysAgoInMS = Date.now() - 2592000000; //1594099120744
    return client.query(`SELECT * FROM events WHERE created_date > ${thirtyDaysAgoInMS} order by start_date_ms asc;`);
  }

  return await fetchEvents();
}

app.get('*', (req, res) => {res.status(404).render('pages/error')});







async function authenticateUser(token) {
    let result = {
      isStudent: false,
      isAdmin: false,
      isPatreon: false,
      username: null,
      discriminator: null,
      id: null,
      picture: null,
      isFound: false
    }
    let userSession = await superagent.get('https://auth.domination-gaming.com/user').set('X-Auth-Token', token);
    let user = userSession.body.discordGuildMember;
    if (user === null) {
      return result = {
      isStudent: false,
      isAdmin: false,
      isPatreon: false,
      username: null,
      discriminator: null,
      id: null,
      picture: null,
      isFound: false
      }
    }
  
    if (user.roles == null) {
      return result = {
        isStudent: false,
        isAdmin: false,
        isPatreon: false,
        username: user.user.username,
        discriminator: user.user.discriminator,
        id: user.user.id,
        picture: user.user.avatar
      };
    } else {
      try {
        user.roles.forEach(role => {
          if (role === DISCORD_ADMIN_GROUP_ID) {
            result.isAdmin = true;
          }
          if (role === DISCORD_PATREON_SUPPORTER || role === DISCORD_PATREON_SUPPORTERPLUS || 
              role === DISCORD_PATREON_SUPPORTERPLUSPLUS || role === DISCORD_PATREON_DOMINATOR) {
            result.isPatreon = true;
          }
          if (role === DISCORD_STUDENT_ADMIN_GROUP_ID) {
            result.isStudent = true;
          }
          });
          return result = {
            isStudent: result.isStudent,
            isAdmin: result.isAdmin,
            isPatreon: result.isPatreon,
            username: user.user.username,
            discriminator: user.user.discriminator,
            id: user.user.id,
            picture: user.user.avatar
          };
        } catch (e) {
          console.log(e);
          return e;
      }
    }
}

function Event(event, showEvent) {
    //EDGE CASE:  Events that are not events, i.e. patreon head starts / srvr mtx
    //event.id to store this in sql and check if its unique
    //date the event was created, this will be used to validate our list later
    //event.start.dateTime   '2020-08-08T20:00:00-04:00'
    //event.start.timeZone   'America/New_York'
    //event.summary   'Late Night Overseer Event',
    //event.description
    // const start = event.start.dateTime || event.start.date;
    // console.log(`${event.id} - ${start} - ${event.summary}`);
    // console.log(event.id)
this.id = event.id;
this.created_date = Date.now();
this.event_start_date = event.start.dateTime ? event.start.dateTime : event.start.date;
this.event_timezone = event.start.timeZone ? event.start.timeZone : 'America/New_York';
this.summary = event.summary;
this.descrption = event.description;
this.showEvent = showEvent;
this.attachments = event.attachments ? event.attachments : false;



}

client.connect((err) => {
    if (err) console.log(err) 
    else app.listen(PORT, () => console.log(`Server is live on port ${PORT}`));
  });