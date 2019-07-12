const init = async () => {
    browser.browserAction.onClicked.addListener(async (tab) => {
        if (isTabRunning(tab.id)) {
            stopTab(tab.id)
        } else {
            runTab(tab)
        }

        setStatus(tab.id)
    })

    browser.tabs.onActivated.addListener(({tabId}) => {
        setStatusByTabId(tabId)
    })

    browser.tabs.onUpdated.addListener(
        (id, {status}, tab) => {
            if (isTabRunning(id) || !isRunningUrl(tab.url)) {
                return
            }

            if (status === 'complete') {
                runTab(tab)

                if (tab.active) {
                    setStatus(tab.id)
                }
            }
        },
        {properties: ['status']}
    )

    browser.tabs.onRemoved.addListener(stopTab)

    const currentTab = await browser.tabs.query({active: true})
    setStatus(currentTab.id)
}

const setStatusByTabId = async (id) => {
    const tab = await browser.tabs.get(id)
    setStatus(tab.id)
}

const setStatus = (tabId) => {
    const running = isTabRunning(tabId)
    browser.browserAction.setIcon({
        path: running ? runningIcon : defaultIcon
    })
}

const findRunningItemByProperty = (name) => (value) =>
    runningItems.find((runningItem) => runningItem.tab[name] === value)

const findRunningItemByTabId = findRunningItemByProperty('id')

const isTabRunning = (id) => !!findRunningItemByTabId(id)

const isRunningUrl = (url) => !!findRunningItemByProperty('url')(url)

const runTab = (tab) => {
    const timer = setInterval(() => {
        browser.tabs.reload(tab.id)
    }, timeout)
    runningItems.push({tab, timer})
}

const stopTab = (id) => {
    const runningItem = findRunningItemByTabId(id)
    clearInterval(runningItem.timer)
    runningItems.splice(runningItems.indexOf(runningItem), 1)
}

const timeout = 1000 * 111
const runningItems = []
const defaultIcon = './icon.svg'
const runningIcon = './icon-running.svg'

init()