let errorRegexp = /[<]p[>]([^<]+)[<][/]p[>]/m
let threadId = undefined
const sender = document.getElementById("sender")
const menu = document.getElementById("menu")
const replyForm = document.getElementById("replyForm")
replyForm.onsubmit = (e) => {
    e.preventDefault()
    let text = input.value
    if (!text) {
        return alert("You must type a reply.")
    }
    let f = new FormData()
    f.append("id", threadId)
    f.append("text", text)
    let r = new XMLHttpRequest()
    r.onload = () => {
        let j = JSON.parse(r.response)
        let id = j["id"]
        alert(`Reply sent: #${id}.`)
    }
    r.open("POST", "/reply/")
    r.send(f)
    ready()
}

const input = document.getElementById("input")
const output = document.getElementById("output")
const buttonNext = document.getElementById("next")
const buttonNew = document.getElementById("new")
const buttonLoad = document.getElementById("load")

const buttonBack = document.getElementById("back")
buttonBack.onclick = ready

const header = document.getElementById("header")
const status = document.getElementById("status")

function loadThread(response) {
    if (response.ok) {
        response.json().then(showThread).catch(showError)
    } else {
        response.text().then((text) => {
            let m = text.match(errorRegexp)
            if (m) {
                m = m[1]
            } else {
                m = response.statusText
            }
            showError({message: m})
        })
    }
}

function clearElement(e) {
    // Below code based on the first answer at:
    // https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
    while (e.firstChild) {
        e.removeChild(e.firstChild)
    }
}

function ready() {
    status.innerText = "No thread loaded yet."
    main.hidden = true
    menu.hidden = false
    buttonNext.focus()
}

const main = document.getElementById("main")
main.hidden = true

function showThread(t) {
    threadId = t.id
    status.innerText = `Thread: #${threadId}.`
    menu.hidden = true
    clearElement(output)
    main.hidden = false
    header.innerText = `Thread #${threadId}`
    input.value = ""
    let caller = true
    if (t.messages.length) {
        for (let i = 0; i < t.messages.length; i++) {
            let message = t.messages[i]
            let h = document.createElement("h4")
            h.innerText = `Reply #${message.id}`
            output.appendChild(h)
            let sender = document.createElement("p")
            sender.innerText = `From: ${caller ? "Caller" : "Samaritans"}`
            output.appendChild(sender)
            let sent = document.createElement("p")
            sent.innerText = `Sent: ${message["sent"]}`
            output.appendChild(sent)
            caller = !caller
            let p = document.createElement("p")
            p.innerText = message.text
            output.appendChild(p)
            output.appendChild(document.createElement("hr"))
        }
    } else {
        let p = document.createElement("p")
        p.innerText = "There are no messages yet."
        output.appendChild(p)
        output.appendChild(document.createElement("hr"))
    }
    input.focus()
    sender.innerText = `Replying as ${(t.messages.length % 2) ? "Samaritans" : "the caller"}.`
}

buttonNext.onclick = () => {
    fetch("/next/").then(loadThread).catch(showError)
}

buttonNew.onclick = () => {
    fetch("/new/").then(loadThread).catch(showError)
}

buttonLoad.onclick = () => {
    alert("Load specific thread.")
}

function showError(err) {
    alert(err.message)
}

buttonLoad.onclick = () => {
    let p = prompt("Enter the thread ID", threadId)
    fetch(`/thread/${p}`).then(loadThread).catch(showError)
}
