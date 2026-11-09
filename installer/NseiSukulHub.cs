using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace NseiSukul
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string bundledNode = Path.Combine(baseDir, "runtime", "node.exe");
                string nodeExe = File.Exists(bundledNode) ? bundledNode : "node";

                string launcherJs = Path.Combine(baseDir, "launcher.js");
                if (!File.Exists(launcherJs))
                {
                    MessageBox.Show(
                        "Cannot find launcher script at:\n" + launcherJs + "\n\nPlease reinstall Nsei Sukul School Hub.",
                        "Nsei Sukul School Hub Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = nodeExe;
                psi.Arguments = "\"" + launcherJs + "\"";
                psi.WorkingDirectory = baseDir;
                psi.UseShellExecute = false;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;

                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Failed to launch Nsei Sukul School Hub:\n\n" + ex.Message,
                    "Nsei Sukul School Hub Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}
