const init = async () => {
    browser.browserAction.onClicked.addListener(async (tab) => {
        if (isTabRunning(tab.id)) {
            stopTab(tab.id)
        } else {
            runTab(tab)
        }

        setStatus(tab.id)
    })

    browser.tabs.onActivated.addListener(({ tabId }) => {
        setStatusByTabId(tabId)
    })

    browser.tabs.onUpdated.addListener((id, { status }, tab) => {
        if (isTabRunning(id) || !isRunningUrl(tab.url)) {
            return
        }

        if (status === 'complete') {
            runTab(tab)

            if (tab.active) {
                setStatus(tab.id)
            }
        }
    })

    browser.tabs.onRemoved.addListener(stopTab)

    setTimersByStoredUrls()

    const [currentTab] = await browser.tabs.query({ active: true })
    setStatus(currentTab.id)
}

const setTimersByStoredUrls = async () => {
    const urls = (await browser.storage.local.get()).urls as Tab['url'][]

    if (!urls) {
        return
    }

    urls.forEach(async (url) => {
        const tab = (await browser.tabs.query({ url }))[0]
        runTab(tab)
    })
}

const setStatusByTabId = async (id: Tab['id']) => {
    if (typeof id === 'undefined') {
        return
    }

    const tab = await browser.tabs.get(id)
    setStatus(tab.id)
}

const setStatus = (tabId: Tab['id']) => {
    const running = isTabRunning(tabId)
    browser.browserAction.setIcon({
        path: running ? runningIcon : defaultIcon,
    })
}

const findRunningItemByProperty =
    (name: keyof Tab) => (value: Tab[keyof Tab]) =>
        runningItems.find((runningItem) => runningItem.tab[name] === value)

const findRunningItemByTabId = findRunningItemByProperty('id')

const isTabRunning = (id: Tab['id']) => !!findRunningItemByTabId(id)

const isRunningUrl = (url: Tab['url']) =>
    !!findRunningItemByProperty('url')(url)

const runTab = (tab: Tab) => {
    const timer = setInterval(() => {
        browser.tabs.reload(tab.id)
    }, timeout)
    runningItems.push({ tab, timer })
    setStoredUrls()
}

const stopTab = (id: Tab['id']) => {
    const runningItem = findRunningItemByTabId(id)

    if (!runningItem) {
        return
    }

    clearInterval(runningItem.timer)
    runningItems.splice(runningItems.indexOf(runningItem), 1)
    setStoredUrls()
}

const setStoredUrls = () => {
    browser.storage.local.set({
        urls: [...new Set(runningItems.map(({ tab }) => tab.url))],
    })
}

const timeout = 1000 * 111
const runningItems: { tab: Tab; timer: number }[] = []
const defaultIcon = './icon.svg'
const runningIcon = './icon-running.svg'

init()
