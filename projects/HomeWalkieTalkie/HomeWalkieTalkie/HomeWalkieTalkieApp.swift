import SwiftUI

@main
struct HomeWalkieTalkieApp: App {
    @StateObject private var walkieTalkie = WalkieTalkieManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(walkieTalkie)
        }
    }
}
