import ExpoModulesCore
import StoreKit

/// Optional tips as consumable in-app purchases. A tip unlocks nothing, so
/// there is nothing to restore: a verified transaction is finished at once.
public class TipJarModule: Module {
  private var updates: Task<Void, Never>?

  public func definition() -> ModuleDefinition {
    Name("TipJar")

    // StoreKit delivers purchases that complete outside the sheet (Ask to Buy,
    // an interrupted payment) here; unfinished ones would be re-sent forever.
    OnCreate {
      self.updates = Task.detached {
        for await update in Transaction.updates {
          if case .verified(let transaction) = update {
            await transaction.finish()
          }
        }
      }
    }

    OnDestroy {
      self.updates?.cancel()
    }

    AsyncFunction("products") { (ids: [String]) -> [[String: String]] in
      let products = try await Product.products(for: ids)
      return products
        .sorted { $0.price < $1.price }
        .map { ["id": $0.id, "title": $0.displayName, "price": $0.displayPrice] }
    }

    AsyncFunction("purchase") { (id: String) -> String in
      guard let product = try await Product.products(for: [id]).first else {
        return "unavailable"
      }
      switch try await product.purchase() {
      case .success(let verification):
        guard case .verified(let transaction) = verification else { return "unverified" }
        await transaction.finish()
        return "thanked"
      case .userCancelled:
        return "cancelled"
      case .pending:
        return "pending"
      @unknown default:
        return "unknown"
      }
    }
  }
}
