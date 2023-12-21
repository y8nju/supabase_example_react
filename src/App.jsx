import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import supabase from './database/supabase';

function App() {
  const [datas, setDatas] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchTests();

    const channels = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'test' },
        (payload) => {
          console.log('Change received!', payload);
          switch(payload.eventType) {
            case 'INSERT':
              setDatas(prev => [...prev, payload.new]);
              break;
            case 'DELETE':
                fetchTests();
              break;
          }
        }
      )
      .subscribe()
    return () => {
      channels.unsubscribe();
    };

  }, []);

  const fetchTests = async () => {
    let { data: test, error } = await supabase
      .from('test')
      .select('*')

    if (test) {
      console.log('Get Datas: ', test);
      setDatas(test);
    } else {
      console.log(error);
    }
  }
  const handleCreate = async (event) => {
    event.preventDefault();

    const { data, error } = await supabase
      .from('test')
      .insert({
        name: name,
        created_at: new Date(),
        id: uuidv4()
      })
      .select()
    if (data) {
      console.log('Insert Data: ', data);
    } else {
      console.log(error);
    }
  }
  
  const handleDelete = async (id) => {
    const { error } = await supabase
    .from('test')
    .delete()
    .eq('id', id);
  }

  return (
    <>
      <section>
        <h2>Supabase Begginer</h2>
      </section>
      <section className='dataList'>
        {datas?.map(data =>
          <div className="data" key={data.id}>
            <span>{data.name}</span>
            <button onClick={() => handleDelete(data.id)}>delete</button>
          </div>
        )}
      </section>
      <form className="inputForm"
        onSubmit={handleCreate}> 
        <input type="text"
          placeholder='name'
          value={name}
          onChange={e => setName(e.target.value)} />
        <button>create</button>
      </form>
    </>
  )
}

export default App
