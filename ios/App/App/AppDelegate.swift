import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        AppSessionGuard.hideSensitiveContent(in: window)
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        AppSessionGuard.hideSensitiveContent(in: window)
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        AppSessionGuard.showContent(in: window)
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        AppSessionGuard.showContent(in: window)
    }

    func application(_ application: UIApplication, shouldAllowExtensionPointIdentifier extensionPointIdentifier: UIApplication.ExtensionPointIdentifier) -> Bool {
        // Third-party keyboards can read office passwords as they are typed.
        if extensionPointIdentifier.rawValue == UIApplication.ExtensionPointIdentifier.keyboard.rawValue {
            return false
        }
        return true
    }

    func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

/// Covers the window while the app is not in the foreground so the recents
/// snapshot does not show student or payment screens.
enum AppSessionGuard {
    private static let coverTag = 918_273

    static func hideSensitiveContent(in window: UIWindow?) {
        guard let window, window.viewWithTag(coverTag) == nil else { return }
        let cover = UIView(frame: window.bounds)
        cover.tag = coverTag
        cover.backgroundColor = UIColor(red: 0.95, green: 0.94, blue: 0.91, alpha: 1)
        cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(cover)
    }

    static func showContent(in window: UIWindow?) {
        window?.viewWithTag(coverTag)?.removeFromSuperview()
    }
}
