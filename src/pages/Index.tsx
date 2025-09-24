import { AuthWrapper } from "@/components/AuthWrapper";
import { GameFlow } from "@/components/GameFlow";

const Index = () => {
  return (
    <AuthWrapper>
      {(user) => <GameFlow user={user} />}
    </AuthWrapper>
  );
};

export default Index;
