using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectMapLanguageServer
{
    public class SimpleLogger
    {
        const string logPefix = ">>ToExt:";

        public static void Log(string log) {
            Console.WriteLine($"{logPefix}{log}\n");
        }

        public static void LogException(Exception ex) {
            Log($"EXCEPTION Type: {ex.GetType()}");
            Log($"EXCEPTION Message: {ex.Message}");
            Log($"EXCEPTION StackTrace: {ex.StackTrace}");
        }
    }
}
