import { Button } from "./Button";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";

type SubmitButtonProps = React.ComponentProps<typeof Button>;

export function SubmitButton({ style, children, ...props }: SubmitButtonProps) {
    return (
        <Button
            variant="primary"
            style={{
                fontWeight: fonts.weight.semibold,
                backgroundColor: colors.fill,
                ...style,
            }}
            {...props}
        >
            {children}
        </Button>
    );
}
