import { Button } from "./button";

interface AddButtonProps {
  added?: boolean;
  label?: string;
}

function AddButton() {
  return (
    <Button
        variant="outline"
        size="lg"

    >
      {label}
    </Button>
  );
}


export { AddButton };