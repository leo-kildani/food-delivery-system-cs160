import { DeployState } from "../actions";

interface DeployFeedbackProps {
  deployState: DeployState;
}

export function DeployFeedback({ deployState }: DeployFeedbackProps) {
  if (!deployState.success && !deployState.error) {
    return null;
  }

  return (
    <>
      {deployState.success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            ✅ Vehicle #{deployState.deployedVehicleId} deployed successfully!
          </p>
        </div>
      )}
      
      {deployState.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">
            ❌ {deployState.error}
          </p>
        </div>
      )}
    </>
  );
}