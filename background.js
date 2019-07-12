const init = async () => {
    browser.browserAction.onClicked.addListener(async (tab) => {
        if (isTabRunning(tab.id)) {
            stopTab(tab.id)
        } else {
            runTab(tab)
        }

        setStatus(tab)
    })

    browser.tabs.onActivated.addListener(({tabId}) => {
        setStatusByTabId(tabId)
    })

    browser.tabs.onUpdated.addListener(
        (id, {status}, tab) => {
            if (isTabRunning(tab.id) || !isRunningUrl(tab.url)) {
                return
            }

            if (status === 'complete') {
                runTab(tab)

                if (tab.active) {
                    setStatus(tab)
                }
            }
        },
        {properties: ['status']}
    )

    browser.tabs.onRemoved.addListener(stopTab)

    const currentTab = await browser.tabs.query({active: true})
    setStatus(currentTab)
}

const setStatusByTabId = async (id) => {
    const tab = await browser.tabs.get(id)
    setStatus(tab)
}

const setStatus = (tab) => {
    const active = isTabRunning(tab.id)
    browser.browserAction.setBadgeText({
        text: String(active)
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
    }, 10000)
    runningItems.push({tab, timer})
}

const stopTab = (id) => {
    const runningItem = findRunningItemByTabId(id)
    clearInterval(runningItem.timer)
    runningItems.splice(runningItems.indexOf(runningItem), 1)
}

const runningItems = []

init()
