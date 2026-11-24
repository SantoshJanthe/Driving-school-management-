import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        if DeviceTrust.isCompromised() {
            window?.rootViewController = DeviceTrust.blockedController()
        } else {
            window?.rootViewController = CAPBridgeViewController()
        }
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        AppSessionGuard.hideSensitiveContent(in: window)
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        AppSessionGuard.hideSensitiveContent(in: window)
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        AppSessionGuard.showContent(in: window)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        AppSessionGuard.showContent(in: window)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
