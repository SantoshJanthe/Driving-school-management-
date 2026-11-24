import UIKit
import IOSSecuritySuite

/// Runtime checks from https://github.com/securing/IOSSecuritySuite.
/// Debug builds skip the checks so Xcode can still run the app.
enum DeviceTrust {
    static func isCompromised() -> Bool {
        #if DEBUG
        return false
        #else
        IOSSecuritySuite.denyDebugger()
        if IOSSecuritySuite.amIDebugged() { return true }
        if IOSSecuritySuite.amIJailbroken() { return true }
        if IOSSecuritySuite.amIReverseEngineered() { return true }
        return false
        #endif
    }

    static func blockedController() -> UIViewController {
        let view = UIViewController()
        view.view.backgroundColor = UIColor(red: 0.95, green: 0.94, blue: 0.91, alpha: 1)
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.numberOfLines = 0
        label.textAlignment = .center
        label.textColor = UIColor(red: 0.1, green: 0.1, blue: 0.09, alpha: 1)
        label.font = .preferredFont(forTextStyle: .body)
        label.text = "This device cannot open MOTOR DRIVING SCHOOL SOFTWARE. Use a phone that is not jailbroken."
        view.view.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: view.view.layoutMarginsGuide.leadingAnchor),
            label.trailingAnchor.constraint(equalTo: view.view.layoutMarginsGuide.trailingAnchor),
            label.centerYAnchor.constraint(equalTo: view.view.centerYAnchor),
        ])
        return view
    }
}
