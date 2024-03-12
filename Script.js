window.addEventListener("DOMContentLoaded", () => {
    ReplaceEmptyImages()
    document.getElementById('app').classList.replace("hidden", "visible")
})
function ReplaceEmptyImages() {
    let allCards = document.querySelectorAll(".card")
    allCards.forEach((card) => {
        let cardImg = card.querySelector('.cardImg')
        let cardTitle = card.querySelector(".cardTitle")
        console.log(cardImg.src)
        if(cardImg.src === '') {
            let replacingNode = GetReplacingNode(cardTitle.innerText)
            cardImg.replaceWith(replacingNode)
        }
    })
}

function GetReplacingNode(title) {
    let replacingNode = document.createElement('div')
    replacingNode.classList.add('replaceImg', 'flexCenter', 'fullWidth')
    let replacingTextNode = document.createElement('div')
    replacingTextNode.classList.add('replaceImgText')
    replacingTextNode.innerText = getFirstLetters(title)
    replacingNode.appendChild(replacingTextNode)
    return replacingNode
}

function getFirstLetters(text) {
    let words = text.split(' ')
    let wordsNb = words.length
    let firstLettersArr = []
    for (let i = 0; i < wordsNb; i++) {
        firstLettersArr.push(words[i][0])
    }
    return firstLettersArr.join(' ')
}

function toggleDarkMode(isOn) {
    document.documentElement.classList.toggle("darkMode", isOn)
}

