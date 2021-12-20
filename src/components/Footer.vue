<template>
  <div class="row q-mb-lg  relative-bottom">
    <div class="col-xs-12 col-md-6 " >
        <div class="column items-center">
            <span >
                COPYRIGHT © {{currentFullYear()}} 
                <a href='/' target='_blank' rel='noopener noreferrer'>
                Teloscan
                </a>
                <span className='d-none d-sm-inline-block'>, All rights Reserved</span>
            </span>
        </div>
    </div>
    <div class="col-xs-12 col-md-6 ">
        <div class="column items-center">
            <span className='float-md-right d-none d-md-block' class="float-right">
                Made with 
                <q-icon name="fas fa-heart red" style="font-size:15px;color:red;padding-bottom:4px" class="q-pl-sm"/>
                + 
                <q-icon name="fas fa-coffee red" style="font-size:15px;color:brown;padding-bottom:4px" class="q-pr-sm"/> 
                by Yknot & Caleos
            </span>
        </div>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    currentFullYear() {
      const current = new Date();
      return current.getFullYear()
    }
  }
};
</script>