import Foundation
import IOKit
import IOKit.hid

/**
 * Native macOS IOHIDManager Bridge for Sunrex 4-Zone RGB Keyboard
 * Target: Acer Predator Helios Neo 16 (PHN16-71)
 * Usage: predator-rgb <hex-packet>
 */

let vendorID = 0x05af // Sunrex
let usagePage = 0xff02

guard CommandLine.arguments.count > 1 else {
    print("Usage: predator-rgb <hex_string>")
    exit(1)
}

let hexString = CommandLine.arguments[1]
var data = Data()
var index = hexString.startIndex
while index < hexString.endIndex {
    let nextIndex = hexString.index(index, offsetBy: 2, limitedBy: hexString.endIndex) ?? hexString.endIndex
    let byteString = String(hexString[index..<nextIndex])
    if let byte = UInt8(byteString, radix: 16) {
        data.append(byte)
    }
    index = nextIndex
}

let manager = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))
let matchDict: [String: Any] = [
    kIOHIDVendorIDKey as String: vendorID
]

IOHIDManagerSetDeviceMatching(manager, matchDict as CFDictionary)
IOHIDManagerOpen(manager, IOOptionBits(kIOHIDOptionsTypeNone))

guard let deviceSet = IOHIDManagerCopyDevices(manager) as? Set<IOHIDDevice> else {
    print("[-] No Sunrex HID device found")
    exit(2)
}

var sent = false
for device in deviceSet {
    let reportID = CFIndex(data[0])
    let result = data.withUnsafeBytes { rawPtr -> IOReturn in
        guard let baseAddress = rawPtr.bindMemory(to: UInt8.self).baseAddress else { return kIOReturnError }
        return IOHIDDeviceSetReport(device, kIOHIDReportTypeFeature, reportID, baseAddress, data.count)
    }
    if result == kIOReturnSuccess {
        sent = true
        break
    }
}

if sent {
    print("[+] Packet delivered to Sunrex 4-Zone RGB controller")
    exit(0)
} else {
    print("[-] Failed to deliver HID report")
    exit(3)
}
