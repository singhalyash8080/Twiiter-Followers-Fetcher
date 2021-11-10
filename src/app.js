const express = require('express')
const cors = require('cors')
const puppeteer = require('puppeteer')
const app = express()

// enabling cors
app.use(cors())

// setting path for serving static files
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.send('Working...')
})

const getFollowers = async (url) => {

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: 'networkidle2' })

    const results = await page.$$eval('div', (tweets) => tweets.map((tweet) => tweet.textContent))

    browser.close()

    const dataArr = results[0].split(" ")

    let idx

    dataArr.forEach((val, i) => {

        if (val == 'FollowersTweetsTweets') {
            idx = i - 1
        }
    })

    const text = dataArr[idx]


    return (text.slice(9))

}

app.get('/updateFollowers', async (req, res) => {

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://docs.google.com/spreadsheets/d/e/2PACX-1vSDk0YMJfOJiMruKS7oGdXIGZb6-m1ybnNv0ikw8o7xZRsaNUCv6RqeucuLNUjP752HRlqVAK0LssFp/pubhtml?gid=0&single=true', { waitUntil: 'networkidle2' })

    const data = await page.$$eval('table tr td', tds => tds.map((td) => {
        return td.innerText;
    }))

    // console.log(data)

    browser.close()

    let tableData = {
        ids: [],
        names: [],
        urls: [],
        followers: []
    }

    let n1 = 3, n2 = 5, n3 = 4

    data.forEach((item, i) => {

        if (i == n1) {
            tableData.ids.push(item)
            n1 += 3
        }
        else if (i == n2) {
            tableData.urls.push(item)
            n2 += 3
        }
        else if (i == n3) {
            tableData.names.push(item)
            n3 += 3
        }
    })

    tableData.followers = await Promise.all(tableData.urls.map(async (url) => await getFollowers(url)))

    // console.log(tableData)

    let html = ``

    for (let i = 0; i < tableData.ids.length; i++) {
        
        html += `<tr>
                    <td>${tableData.ids[i]}</td>
                    <td>${tableData.names[i]}</td>
                    <td>${tableData.urls[i]}</td>
                    <td>${tableData.followers[i]}</td>
                </tr>`
    }

    res.send(`<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Followers table</title>

            <style>
                table, td, th{
                    border: 1px black solid;
                }


            </style>
        </head>
        <body>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>URL</th>
                    <th>Followers</th>
                </tr>
                ${html}
            </table>
        </body>
        </html>`)
})

app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message })
})

module.exports = app