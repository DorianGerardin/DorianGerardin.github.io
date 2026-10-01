let selectedTags = []

const PROJECTS_URL = "static/data/projects.json"
const IS_CMS_PREVIEW = new URLSearchParams(location.search).has("cms-preview")

document.addEventListener("DOMContentLoaded", async () => {
    RenderProjects(IS_CMS_PREVIEW ? [] : await LoadProjects())
    InitDetailsToggle()
    const preferredTheme = localStorage.getItem('theme');
    preferredTheme ? SetTheme(preferredTheme) : detectSystemThemeChange(updateTheme);
    setTimeout(() => {
        document.body.classList.replace("visibilityHidden", "visibilityVisible")
        document.body.style.transition = "background-color 0.25s ease-in-out, color 0.25s ease-in-out"
    }, 100)
})

function InitDetailsToggle() {
    const button = document.getElementById("toggleDetails")
    if (!button) return
    SetDetailsHidden(localStorage.getItem("hideDetails") === "true")
    button.addEventListener("click", () => {
        const hide = button.getAttribute("aria-pressed") !== "true"
        SetDetailsHidden(hide)
        localStorage.setItem("hideDetails", hide)
    })
}

function SetDetailsHidden(hide) {
    const button = document.getElementById("toggleDetails")
    document.getElementById("cardContainer").classList.toggle("hideDetails", hide)
    button.setAttribute("aria-pressed", hide)
    const label = hide ? "Afficher les descriptions et les tags" : "Masquer les descriptions et les tags"
    button.title = label
    button.setAttribute("aria-label", label)
}

function RenderProjects(projects) {
    CreateCards(projects)
    FilterCardsByTags(selectedTags)
    SetCards()
    SetTags()
}

if (IS_CMS_PREVIEW) {
    window.addEventListener("message", (event) => {
        if (event.origin !== location.origin) return
        if (event.data?.type !== "cms-preview") return
        RenderProjects(event.data.projects ?? [])
    })
}

async function LoadProjects() {
    try {
        const response = await fetch(PROJECTS_URL, { cache: "no-cache" })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        return Array.isArray(data) ? data : (data.projects ?? [])
    } catch (error) {
        console.error("Impossible de charger les projets :", error)
        return []
    }
}

function CreateCards(projects) {
    const container = document.getElementById("cardContainer")
    container.innerHTML = ""
    projects.forEach(project => container.appendChild(CreateCard(project)))
}

function CreateCard(project) {
    const el = (tag, className, text) => {
        const node = document.createElement(tag)
        if (className) node.className = className
        if (text !== undefined) node.textContent = text
        return node
    }

    const card = el("div", "card fullSize hidden")
    card.setAttribute("data-target", project.target ?? "")
    card.setAttribute("data-color", project.color ?? "")

    // Miniature (si absente, SetCards() affichera les initiales du titre)
    const thumbnailContainer = el("div", "thumbnailContainer")
    const img = el("img", "cardImg")
    if (project.thumbnail) {
        img.src = project.thumbnail
    }
    img.alt = `${project.title} thumbnail`
    thumbnailContainer.appendChild(img)

    // Contenu
    const content = el("div", project.whiteText ? "cardContent text-white" : "cardContent")
    content.appendChild(el("div", "cardTitle", project.title ?? ""))
    content.appendChild(el("div", "cardDescription", project.description ?? ""))

    const tagsContainer = el("div", "cardTagsContainer")
    ;(project.tags ?? []).forEach(tag => tagsContainer.appendChild(el("div", "cardTag", tag)))
    content.appendChild(tagsContainer)

    card.appendChild(thumbnailContainer)
    card.appendChild(content)
    return card
}

function SetCards() {
    let allCards = document.querySelectorAll(".card")
    allCards.forEach((card) => {
        let cardImg = card.querySelector('.cardImg')
        let cardTitle = card.querySelector(".cardTitle")
        if (card.dataset.color) {
            card.style.setProperty("--custom-bg", card.dataset.color)
            card.classList.add("hasColor")
        }

        if(!cardImg.getAttribute('src')) {
            let replacingNode = GetReplacingNode(cardTitle.textContent)
            cardImg.replaceWith(replacingNode)
        } else {
            let cardContentBG =  document.createElement('img')
            cardContentBG.src = cardImg.src
            cardContentBG.classList.add('cardContentBg')
            card.appendChild(cardContentBG)
        }
        let target = card.getAttribute('data-target')
        if(target) {
            let linkArrowNode = document.createElement("div")
            linkArrowNode.classList.add("linkArrow")
            card.appendChild(linkArrowNode)
        }
        card.addEventListener("click", () => {
            if(!target) {
                alert("Project not available")
            } else {
                window.open(target, "_blank");
            }
        })
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

function SetTags() {
    let allTags = document.querySelectorAll(".cardTag")
    allTags.forEach((tag) => {
        let tagText = tag.textContent
        let style = getComputedStyle(document.documentElement)
        let darkTextColor = style.getPropertyValue('--dark-text-color')
        let bgColor = stringToColor(tagText)
        let textContrast = getContrastTextColor(bgColor)
        let tagColorText = textContrast === 1 ? darkTextColor : style.getPropertyValue('--white-text-color')
        tag.addEventListener('mouseover', function() {
            this.style.boxShadow = `0px 0px 0px 2px ${bgColor} inset`;
            this.style.backgroundColor = 'transparent';
            this.style.color = window.getComputedStyle(tag.closest('.cardContent')).color
        });

        tag.addEventListener('mouseout', function() {
            this.style.boxShadow = 'none';
            this.style.backgroundColor = bgColor;
            this.style.color = tagColorText
        });

        tag.addEventListener('click', function(event) {
            event.stopPropagation()
            if(!selectedTags.includes(tagText)) {
                AddSelectedTag(tagText, bgColor, tagColorText)
            }
            FilterCardsByTags(selectedTags)
        });
        tag.style.backgroundColor = bgColor
        tag.style.color = tagColorText
    })
}

function FilterCardsByTags(tags) {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const cardTags = Array.from(card.querySelectorAll('.cardTag')).map(tag => tag.textContent);
        /* const containsAllTags = cardTags.every(tag => tag.includes(cardTags));*/
        const containsAllTags = arrIncludedInOtherArr(tags, cardTags)
        if (containsAllTags) {
            card.classList.replace("hidden", "visible")
        } else {
            card.classList.replace("visible", "hidden")
        }
    });
}

function AddSelectedTag(textContent, bgColor, textColor) {
    let newTag = document.createElement("div")
    newTag.classList.add("cardTagSelected")
    newTag.textContent = textContent
    newTag.style.backgroundColor = bgColor
    newTag.style.color = textColor
    newTag.addEventListener("click", () => {
        RemoveSelectedTag(newTag)
    })
    let selectedTagsContainer = document.getElementById("selectedTags")
    selectedTagsContainer.appendChild(newTag);
    selectedTags.push(textContent)
}

function RemoveSelectedTag(tag) {
    selectedTags = selectedTags.filter(tagText => tagText !== tag.textContent)
    tag.remove()
    FilterCardsByTags(selectedTags)
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let j = 0; j < 3; j++) {
        let value = (hash >> (j * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }

    return color;
}

function getContrastTextColor(hexColor) {
    let r = parseInt(hexColor.substr(1, 2), 16);
    let g = parseInt(hexColor.substr(3, 2), 16);
    let b = parseInt(hexColor.substr(5, 2), 16);

    let luminance = (r * 0.299 + g * 0.587 + b * 0.114);

    return (luminance > 150) ? 1 : 0;
}

function toggleDarkMode(isOn) {
    const currentTheme = isOn ? 'dark' : 'light';
    SetTheme(currentTheme)
    localStorage.setItem('theme', currentTheme);
}

function SetTheme(theme) {
    let toggleLightButton = document.getElementById("sun")
    let toggleDarkButton = document.getElementById("moon")
    if(theme === "dark") {
        toggleLightButton.classList.replace("transparent", "opaque")
        toggleLightButton.classList.replace("behind", "front")
        toggleDarkButton.classList.replace("front", "behind")
        toggleDarkButton.classList.replace("opaque", "transparent")
    } else {
        toggleDarkButton.classList.replace("transparent", "opaque")
        toggleDarkButton.classList.replace("behind", "front")
        toggleLightButton.classList.replace("front", "behind")
        toggleLightButton.classList.replace("opaque", "transparent")
    }
    document.documentElement.setAttribute('data-theme', theme);
}

function detectSystemThemeChange(callback) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    toggleDarkMode(mediaQuery.matches)
    mediaQuery.addEventListener('change', callback);
}

function updateTheme(event) {
    const currentTheme = event.matches ? 'dark' : 'light';
    SetTheme(currentTheme)
}

function arrIncludedInOtherArr(arr1, arr2) {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    for (let item of set1) {
        if (!set2.has(item)) {
            return false;
        }
    }

    return true;
}