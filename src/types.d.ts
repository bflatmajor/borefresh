import { Browser, Tabs } from 'webextension-polyfill'

declare global {
    const browser: Browser
    type Tab = Tabs.Tab
}
