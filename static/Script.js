let selectedTags = []

window.addEventListener("DOMContentLoaded", () => {
    FilterCardsByTags(selectedTags)
    SetCards()
    SetTags()
    const preferredTheme = localStorage.getItem('theme');
    preferredTheme ? SetTheme(preferredTheme) : detectSystemThemeChange(updateTheme);
    setTimeout(() => {
        document.body.classList.replace("visibilityHidden", "visibilityVisible")
    }, 100)
})

function SetCards() {
    let allCards = document.querySelectorAll(".card")
    allCards.forEach((card) => {
        let cardImg = card.querySelector('.cardImg')
        let cardTitle = card.querySelector(".cardTitle")
        if(cardImg.src === '') {
            let replacingNode = GetReplacingNode(cardTitle.textContent)
            cardImg.replaceWith(replacingNode)
        }
        let target = card.getAttribute('data-target')
        if(target !== "") {
            card.querySelector(".linkArrow").classList.replace("hidden", "visible")
        }
        card.addEventListener("click", () => {
            if(target === "") {
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
        //let bgColor = stringToColor(tagText)
        let bgColor = stringToVibrantColor(tagText)
        let textContrast = getContrastTextColor(bgColor)
        let tagColorText = textContrast === 1 ? darkTextColor : style.getPropertyValue('--white-text-color')
        tag.addEventListener('mouseover', function() {
            this.style.boxShadow = `0px 0px 0px 2px ${bgColor} inset`;
            this.style.backgroundColor = 'transparent';
            this.style.color = style.getPropertyValue('--main-text-color')
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

function stringToVibrantColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let j = 0; j < 3; j++) {
        // Utilisation de valeurs RVB plus élevées et ajout de variations
        let value = ((hash >>> (j * 8)) + (j * 100)) % 256;
        // Convertir la valeur en une chaîne hexadécimale de deux caractères
        let hex = ('0' + value.toString(16)).slice(-2);
        color += hex;
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

