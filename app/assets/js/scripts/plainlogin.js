/**
 * Script for plainlogin.ejs
 */
// Validation Regexes.
const validPlainUsername         = /^[a-zA-Z0-9_]{1,16}$/
// const basicEmail            = /^\S+@\S+\.\S+$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

// Login Elements
const plainloginCancelContainer  = document.getElementById('plainloginCancelContainer')
const plainloginCancelButton     = document.getElementById('plainloginCancelButton')
const plainloginUsernameError    = document.getElementById('plainloginUsernameError')
const plainloginUsername         = document.getElementById('plainloginUsername')
const plainloginButton           = document.getElementById('plainloginButton')
const plainloginForm             = document.getElementById('plainloginForm')

// Control variables.
let plu = false


/**
 * Show a login error.
 * 
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showError(element, value){
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a login error to add emphasis.
 * 
 * @param {HTMLElement} element The element to shake.
 */
function shakeError(element){
    if(element.style.opacity == 1){
        element.classList.remove('shake')
        void element.offsetWidth
        element.classList.add('shake')
    }
}

/**
 * Validate that an email field is neither empty nor invalid.
 * 
 * @param {string} value The email value.
 */
function validatePlainUsername(value){
    if(value){
        if(!validPlainUsername.test(value)){
            showError(plainloginUsernameError, Lang.queryJS('login.error.invalidValue'))
            plainloginDisabled(true)
            plu = false
        } else {
            plainloginUsernameError.style.opacity = 0
            plainloginDisabled(false)
        }
    } else {
        plu = false
        showError(plainloginUsernameError, Lang.queryJS('login.error.requiredValue'))
        plainloginDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
plainloginUsername.addEventListener('focusout', (e) => {
    validatePlainUsername(e.target.value)
    shakeError(plainloginUsernameError)
})

// Validate input for each field.
plainloginUsername.addEventListener('input', (e) => {
    validatePlainUsername(e.target.value)
})

/**
 * Enable or disable the login button.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function plainloginDisabled(v){
    if(plainloginButton.disabled !== v){
        plainloginButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function plainloginLoading(v){
    if(v){
        plainloginButton.setAttribute('loading', v)
        plainloginButton.innerHTML = plainloginButton.innerHTML.replace(Lang.queryJS('plainlogin.login'), Lang.queryJS('plainlogin.loggingIn'))
    } else {
        plainloginButton.removeAttribute('loading')
        plainloginButton.innerHTML = plainloginButton.innerHTML.replace(Lang.queryJS('plainlogin.loggingIn'), Lang.queryJS('plainlogin.login'))
    }
}

/**
 * Enable or disable login form.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function plainformDisabled(v){
    plainloginDisabled(v)
    plainloginCancelButton.disabled = v
    plainloginUsername.disabled = v
}

let plainloginViewOnSuccess = VIEWS.landing
let plainloginViewOnCancel = VIEWS.settings
let plainloginViewCancelHandler

function plainloginCancelEnabled(val){
    if(val){
        $(plainloginCancelContainer).show()
    } else {
        $(plainloginCancelContainer).hide()
    }
}

plainloginCancelButton.onclick = (e) => {
    switchView(getCurrentView(), plainloginViewOnCancel, 500, 500, () => {
        plainloginUsername.value = ''
        plainloginCancelEnabled(false)
        if(plainloginViewCancelHandler != null){
            plainloginViewCancelHandler()
            plainloginViewCancelHandler = null
        }
    })
}


plainloginCancelEnabled(true)
// Disable default form behavior.
plainloginForm.onsubmit = () => { return false }

// Bind login button behavior.
plainloginButton.addEventListener('click', () => {
    // Disable form.
    plainformDisabled(true)

    // Show loading stuff.
    // plainloginLoading(true)

    // let value = plainloginUsername.value
    AuthManager.addPlainAccount(plainloginUsername.value).then((value) => {
        updateSelectedAccount(value)
        setTimeout(() => {
            switchView(VIEWS.plainlogin, plainloginViewOnSuccess, 500, 500, async () => {
                // Temporary workaround
                if(plainloginViewOnSuccess === VIEWS.settings){
                    await prepareSettings()
                }
                plainloginViewOnSuccess = VIEWS.landing // Reset this for good measure.
                plainloginCancelEnabled(false) // Reset this for good measure.
                plainloginViewCancelHandler = null // Reset this for good measure.
                plainloginUsername.value = ''
                plainformDisabled(false)
            })
        }, 1000)
    }).catch((displayableError) => {
        plainloginLoading(false)

        let actualDisplayableError
        if(isDisplayableError(displayableError)) {
            msftLoginLogger.error('Error while logging in.', displayableError)
            actualDisplayableError = displayableError
        } else {
            // Uh oh.
            msftLoginLogger.error('Unhandled error during login.', displayableError)
            actualDisplayableError = Lang.queryJS('plainlogin.error.unknown')
        }

        setOverlayContent(actualDisplayableError.title, actualDisplayableError.desc, Lang.queryJS('plainlogin.tryAgain'))
        setOverlayHandler(() => {
            plainformDisabled(false)
            toggleOverlay(false)
        })
        toggleOverlay(true)
    })

})