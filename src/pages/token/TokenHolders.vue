<template>
<div class="container">
    <div class="row">
        <div class="col-12">
            <q-table
                :pagination.sync="pagination"
                :data="holders"
                :columns="columns"
                :loading="loading"
                flat
                @request="onRequest"
            >
                <q-tr slot="header">
                    <q-th v-for="col in columns" :key="col.label">
                        {{ col.label }}
                    </q-th>
                </q-tr>

                <q-tr
                    slot="body"
                    slot-scope="props"
                    :props="props"
                >
                    <q-td key="address">
                        <router-link :to="`/address/${props.row.holder.address}`">
                            <address-field
                                :address="props.row.holder.address"
                                :is-contract="props.row.holder.isContract"
                            />
                        </router-link>
                    </q-td>
                    <q-td key="balance">
                        {{ props.row.balance }}
                    </q-td>
                </q-tr>
            </q-table>
        </div>
    </div>
</div>
</template>

<!--
    eztodo yeet this

    https://api.teloscan.io/v1/holders/0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E?limit=50

    {"contracts":{"0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E":{"creator":"0x7AFe134BAd08E70f3143c5212955239Ade95364d","address":"0xD102cE6A4dB07D247fcc28F366A623Df0938CA9E","block":181142510,"from_trace":false,"trace_address":"","transaction":"0x9630bb161c0c6ef282b554b3cf855ede3599087ac052edf513faefd1b1d6d704"}},"results":[{"address":"0xf9678db1ce83f6f51e5df348e2cc842ca51efec1","balance":"3736947567908279551217655"},{"address":"0xb9239af0697c8efb42cba3568424b06753c6da71","balance":"3446803346871232455715513"},{"address":"0x1b02da8cb0d097eb8d57a175b88c7d8b47997506","balance":"2791213352188331514889403"},{"address":"0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a","balance":"847255892713941787450409"},{"address":"0xea96c8d2ffa10ffef65a87c957c27114051336f4","balance":"832798775503560964083601"},{"address":"0x651fcc98a348c91fdf087903c25a638a25344dff","balance":"681512576094342696080283"},{"address":"0xf82a69c26118f11376947388920a8a51954dcc9a","balance":"536976233610331733297112"},{"address":"0xa8a2ccbd5b130bd965dc2c24fc8938aea7493216","balance":"516087424862328381332360"},{"address":"0xc931f61b1534eb21d8c11b24f3f5ab2471d4ab50","balance":"474613822100392018576422"},{"address":"0xebee938ff39b6f1ef146636a9a1bebed6e6d13ad","balance":"415607415061154908891340"},{"address":"0x774d427b2105849a0fbb6f49c432c087e3607f6f","balance":"347691645164429522124714"},{"address":"0x5d9ab5522c64e1f6ef5e3627eccc093f56167818","balance":"305081037770000000000000"},{"address":"0x06754b2a38782aa5c9b071dc70a5c49457c7ebd1","balance":"184858983568906736736893"},{"address":"0x2c3dd9b87f5ecd49f6ae3566a5d61d8ea6dc21c2","balance":"182859735818085686703002"},{"address":"0xa58615cb042e2ba96c8bef072aad256c15ac8372","balance":"170164590428574867074735"},{"address":"0x65980727179035c6a10dc5d79057b842e893627c","balance":"164389952395562787606134"},{"address":"0x62514ad55d9fbb7ea66a915a1a1e11872f5faa90","balance":"149098430786876148669738"},{"address":"0x8dfb20737af995f78faa5eb0349a7766ee3a543e","balance":"144250386629510207211735"},{"address":"0xb4769f27468e25ae948b9c1b9de76e6d76929d01","balance":"125659463565954908286442"},{"address":"0xd0d08c23d0cfd88457cdd43caf34c16e3a29e85f","balance":"122535494763247179416125"},{"address":"0x68413e6bb7b9cb0ab9cc3c62946ef44f0a4a198d","balance":"114862538953916022371628"},{"address":"0x75840ebb437981a3f3f1f004513821e0ccdcfc21","balance":"93595410572637093387806"},{"address":"0xf795546229e46388b951a622b48035233e3c0c41","balance":"89577931975592167729220"},{"address":"0xc0142b087903cc70f486544d1a416182a24b49b5","balance":"77797577080622970402078"},{"address":"0x933f83735f26e51c61955b4fca88f13fbd423a0c","balance":"65456216757373665897017"},{"address":"0x427e9a7bb848444a72faa3248c48f3b302429725","balance":"61966206451183225645325"},{"address":"0x2cdb9fb591e3e0b5bee0a11dcba3f1be62b3e1ce","balance":"58700011493952782503450"},{"address":"0xa1bee888644ce6ff9b368f6fb08cc3d6fef5132b","balance":"57720030601529466523327"},{"address":"0x106c0c39b338f5b62653ee4f053b05fad34d2eab","balance":"55046919585063201495720"},{"address":"0xeb002af9ca6aa416baacefa78e5d505759286355","balance":"47817888451651215894944"},{"address":"0x358b40beaa062300417400e40eaa30ac8ce316f3","balance":"47687743410541752471376"},{"address":"0x4cd1b4595ec1ec2afd0096ae37ffc7b6cef8cc86","balance":"38901348019939893758469"},{"address":"0x3eff1f57305b3d685ed1dbbc3e287d534f3d0bfc","balance":"38025127635369052659427"},{"address":"0x0cc69a446ad55cd4b414af5a9e1a1f7096bda610","balance":"36482059686909333900024"},{"address":"0x612a09d7e015d263360d20b00f810c04625c3c7f","balance":"35782042553585843038734"},{"address":"0x5aad5c61c64bdcb1122f7ea21476fa44e14a8159","balance":"35003056249374642943978"},{"address":"0xc72ca4d9ef358e1d8989e36df9dfa28378137d20","balance":"34602900557183767000755"},{"address":"0xe320e5c4260c7186fdb0ea782a3c802736da743f","balance":"32437863747053760706032"},{"address":"0xce44ab79bb596681ea1d264b62e351ef141e8091","balance":"32358340526169863173107"},{"address":"0x69f0c295db683ddc1f26f07b5c0ee5e121fa4bbf","balance":"31321459353382146300972"},{"address":"0xa9a36523fc178bcbb3634f7deaa1d45d513dd02c","balance":"27013501036699689821939"},{"address":"0x7b90a6355fac6f0b928aa815335b5aa42dd2749e","balance":"24208711977807814477480"},{"address":"0x60689af0cd4d1f6886b231b19130ed8bac620750","balance":"21468732152769394953218"},{"address":"0xe36aaf76f4d769799c29ebb63f35023239c28b56","balance":"21467832367776829438922"},{"address":"0x5b9447ef36abf518cca729bf08e8d72b24a69bdf","balance":"20858506227692356166948"},{"address":"0x5ab1d696db4212f028c02e99d9a560f06c49f641","balance":"19919764175526945005470"},{"address":"0x72801e883ebf8548d0bf9bcf149df72d84542448","balance":"18433616699527098477731"},{"address":"0x09f3d2a101c430523d3908a31eaf014a3d388777","balance":"18081602625548888845131"},{"address":"0x9b81d498c824aea5392ee81e777347d770782ece","balance":"17157186448971437414726"},{"address":"0x70a7323db6a3cfb4a5aaa840f42144ab801b867a","balance":"16377259201223207959449"}]}
 -->

<script>
import { keys } from 'lodash';

import AddressField from 'components/AddressField';

import { formatBN } from 'src/lib/utils';

const columns = [
    {
        name: 'address',
        label: 'Address',
        align: 'left',
    },{
        name: 'balance',
        label: 'Balance',
        align: 'left',
    },
];

export default {
    name: 'TokenHolders',
    components: {
        AddressField,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    data: () => ({
        columns,
        pagination: {},
        holders: [],
        loading: true,
    }),
    created() {
        const params = {
            limit: 50,
            offset: null,
        };

        this.$teloscanApi.get(`holders/${this.address}`, { params })
            .then(({ data }) => {
                const rows = data?.results ?? [];
                const tokenContractMeta = data?.contracts[this.address] ?? {};
                const contractAddresses = keys(data?.contracts);

                const shapedRows = rows.map(({ balance, address }) => ({
                    balance: formatBN(balance, tokenContractMeta.decimals, 6),
                    holder: {
                        address,
                        isContract: contractAddresses.includes(address),
                    },
                }));

                this.$emit('token-info-loaded', tokenContractMeta);
                this.holders = [...shapedRows];
            })
            .catch((err) => {
                console.error(`Unable to fetch token holders for address ${this.address}:\n${err}`);
            })
            .finally(() => {
                this.loading = false
            });
    },
    methods: {
        onRequest() {
            return;
        },
    },
}
</script>

<style lang="scss">
</style>
