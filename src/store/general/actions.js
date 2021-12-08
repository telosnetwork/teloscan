
export const fetchTlosPrice = async function({ dispatch, commit }) {
    const response = await this.$api.getTableRows({
        code: "delphioracle",
        limit: "1000",
        scope: "tlosusd",
        table: "datapoints"
      });

      const tlosPrice = response.rows[0].median / 10000;
      commit("setTlosPrice", tlosPrice);

}