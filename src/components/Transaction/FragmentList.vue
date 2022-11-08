<script>
import FragmentListElement from 'components/Transaction/FragmentListElement'
export default {
    name: 'FragmentList',
    components: {
        FragmentListElement,
    },
    props: {
        fragments: {
            type: Array,
            required: true,
        },
        parsedFragments: {
            type: Array,
            required: true,
        },
    },
}
</script>
<template>
<div class="q-pa-md" :key="parsedFragments.length == fragments.length">
    <div class="row">
        <div class="col-12">
            <FragmentListElement
                :key="'ltr' + i"
                v-for="(fragment, i) in fragments"
                :rawFragment="fragment"
                :fragment="parsedFragments[i]"
            />
        </div>
        <div v-if="fragments.length !== parsedFragments.length" class="col-12 u-flex--center">
            <q-spinner size="md" />
        </div>
    </div>
</div>
</template>
