interface Navigator {
    brave?: {
        isBrave: () => Promise<boolean>;
    };
}
