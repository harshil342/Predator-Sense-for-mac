import Cocoa
import Foundation

/**
 * PredatorSense macOS Status Bar / Menubar Companion
 * Target: Acer Predator Helios Neo 16 (PHN16-71)
 * Displays real-time thermals & provides instant performance mode switching.
 */

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem!
    var timer: Timer?
    let daemonUrl = URL(string: "http://127.0.0.1:48800")!

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem.button {
            button.title = "⚡ 48°C • 2150 RPM"
        }

        buildMenu()

        // Poll daemon every 2 seconds for menu bar status
        timer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            self?.fetchTelemetry()
        }
    }

    func buildMenu() {
        let menu = NSMenu()
        
        let headerItem = NSMenuItem(title: "PredatorSense (Helios Neo 16)", action: nil, keyEquivalent: "")
        headerItem.isEnabled = false
        menu.addItem(headerItem)
        menu.addItem(NSMenuItem.separator())

        // Modes
        menu.addItem(NSMenuItem(title: "🟢 Quiet Mode (35W / Silence)", action: #selector(setQuiet), keyEquivalent: "1"))
        menu.addItem(NSMenuItem(title: "🔵 Balanced Mode (55W / Auto)", action: #selector(setBalanced), keyEquivalent: "2"))
        menu.addItem(NSMenuItem(title: "🟣 Performance Mode (75W)", action: #selector(setPerf), keyEquivalent: "3"))
        menu.addItem(NSMenuItem(title: "🔥 Turbo Mode (Max 115W + Fans)", action: #selector(setTurbo), keyEquivalent: "4"))
        menu.addItem(NSMenuItem(title: "🌱 ECO Mode (Power Saver)", action: #selector(setEco), keyEquivalent: "5"))
        menu.addItem(NSMenuItem.separator())

        // Fan controls
        menu.addItem(NSMenuItem(title: "🌪️ CoolBoost: Max Fans (100%)", action: #selector(setMaxFans), keyEquivalent: "m"))
        menu.addItem(NSMenuItem(title: "🔄 CoolBoost: Auto Curve", action: #selector(setAutoFans), keyEquivalent: "a"))
        menu.addItem(NSMenuItem.separator())

        // Open Dashboard
        menu.addItem(NSMenuItem(title: "🖥️ Open PredatorSense Dashboard", action: #selector(openDashboard), keyEquivalent: "o"))
        menu.addItem(NSMenuItem.separator())

        menu.addItem(NSMenuItem(title: "Quit", action: #selector(quitApp), keyEquivalent: "q"))

        statusItem.menu = menu
    }

    func fetchTelemetry() {
        let stateUrl = URL(string: "http://127.0.0.1:48800/api/state")!
        var request = URLRequest(url: stateUrl)
        request.timeoutInterval = 1.0

        URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            guard let data = data,
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return }

            let cpuTemp = (json["cpuTemp"] as? NSNumber)?.intValue ?? (json["cpuTemp"] as? Int) ?? 48
            let cpuRpm = (json["cpuFanRpm"] as? NSNumber)?.intValue ?? (json["cpuFanRpm"] as? Int) ?? 2150

            DispatchQueue.main.async {
                self?.statusItem.button?.title = "⚡ \(cpuTemp)°C • \(cpuRpm) RPM"
            }
        }.resume()
    }

    func sendMode(_ mode: String) {
        let ctrlUrl = URL(string: "http://127.0.0.1:48800/api/control")!
        var request = URLRequest(url: ctrlUrl)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body = ["mode": mode]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request).resume()
    }

    @objc func setQuiet() { sendMode("quiet") }
    @objc func setBalanced() { sendMode("balanced") }
    @objc func setPerf() { sendMode("performance") }
    @objc func setTurbo() { sendMode("turbo") }
    @objc func setEco() { sendMode("eco") }

    @objc func setMaxFans() {
        let ctrlUrl = URL(string: "http://127.0.0.1:48800/api/control")!
        var req = URLRequest(url: ctrlUrl)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["fanMode": "max"])
        URLSession.shared.dataTask(with: req).resume()
    }

    @objc func setAutoFans() {
        let ctrlUrl = URL(string: "http://127.0.0.1:48800/api/control")!
        var req = URLRequest(url: ctrlUrl)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONSerialization.data(withJSONObject: ["fanMode": "auto"])
        URLSession.shared.dataTask(with: req).resume()
    }

    @objc func openDashboard() {
        NSWorkspace.shared.open(daemonUrl)
    }

    @objc func quitApp() {
        NSApplication.shared.terminate(nil)
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
