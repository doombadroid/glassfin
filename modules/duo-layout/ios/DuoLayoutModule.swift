import ExpoModulesCore

public class DuoLayoutModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DuoLayout")

    View(DuoLayoutObserverView.self) {
      Events("onDuoLayoutChange")
    }
  }
}
