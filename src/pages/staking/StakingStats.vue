<template>
<div class="c-staking-stats">
    <div class="c-staking-page__stats-container c-staking-page__stats-container--global">
        <div
            v-for="{ label, value, unit, tooltip } in globalStats"
            :key="label"
            class="c-staking-page__stat c-staking-page__stat--global"
        >
            <div class="c-staking-page__stat-label c-staking-page__stat-label--global">
                {{ label }}
                <q-icon name="fas fa-info-circle" />
            </div>

            <div class="c-staking-page__stat-value">
                {{ value }}
                <span class="c-staking-page__stat-unit">{{ unit }}</span>
            </div>

            <q-tooltip
                :offset="[0, 56]"
                anchor="bottom left"
                self="center left"
            >
                <span class="u-text--pre">{{ tooltip }}</span>
            </q-tooltip>
        </div>
    </div>

    <q-card class="c-staking-page__stats-container c-staking-page__stats-container--personal">
        <div class="c-staking-page__stat c-staking-page__stat--personal">
            <div class="c-staking-page__stat-label">
                {{ personalStats.staked.label }}
                <q-icon name="fas fa-info-circle" />
            </div>

            <span class="c-staking-page__stat-value">
                        {{ personalStats.staked.value.stlos }}
                        <span v-if="isLoggedIn" class="c-staking-page__stat-unit c-staking-page__stat-unit--personal">sTLOS</span>
                        &#32; <!-- breaking space - avoid whitespace collapsing when this long stat wraps-->
                    </span>
            <span v-if="isLoggedIn" class="c-staking-page__stat-value">
                        <wbr>
                        &#8776; <!-- ≈ -->
                        {{ personalStats.staked.value.tlos }}
                        <span class="c-staking-page__stat-unit c-staking-page__stat-unit--personal">TLOS</span>
                    </span>

            <q-tooltip
                :offset="[0, 56]"
                anchor="bottom left"
                self="center left"
            >
                        <span class="u-text--pre">
                            {{ personalStats.staked.tooltip }}
                        </span>
            </q-tooltip>
        </div>
        <div class="c-staking-page__stat c-staking-page__stat--personal">
            <div class="c-staking-page__stat-label">
                {{ personalStats.unstaked.label }}
                <q-icon name="fas fa-info-circle" />
            </div>

            <span class="c-staking-page__stat-value">
                        {{ personalStats.unstaked.value }}
                        <span v-if="isLoggedIn" class="c-staking-page__stat-unit c-staking-page__stat-unit--personal">
                            TLOS
                        </span>
                    </span>

            <q-tooltip
                :offset="[0, 56]"
                anchor="bottom left"
                self="center left"
            >
                        <span class="u-text--pre">
                            {{ personalStats.unstaked.tooltip }}
                        </span>
            </q-tooltip>
        </div>
    </q-card>
</div>
</template>

<script>
export default {
    name: 'StakingStats',
    props: {
        globalStats: {
            type: Object,
            required: true,
            validator: (stats) => Array.isArray(stats) && stats.every(
                ({ label, value, unit, tooltip }) => [label, value, unit, tooltip].every(field => typeof field === 'string'),
            ),
        },
        personalStats: {
            type: Object,
            required: true,
            validator: ({ staked, unstaked }) => [
                staked?.label,
                staked?.tooltip,
                staked?.value?.stlos,
                staked?.value?.tlos,
                unstaked?.label,
                unstaked?.tooltip,
                unstaked?.value,
                unstaked?.label,
                unstaked?.tooltip,
                unstaked?.value,
            ].every(field => typeof field === 'string'),
        },
    },
}
</script>

<style>

</style>
